import { useRouter } from 'next/router';
import { useState, useRef, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import html2canvas from 'html2canvas';
import { Camera, Plus, Trash2, Send, Loader2, ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Head from 'next/head';

const supabase = createClient(
  'https://rticfwqptlxkpgawpzwf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0aWNmd3FwdGx4a3BnYXdwendmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDA2MTEsImV4cCI6MjA4OTQxNjYxMX0.vOmi-rKKxXuZ5SP7uZe81Cr0fKW_fWN4Hmuf90soijM'
);

export default function ChecklistPage() {
  const router = useRouter();
  const { id, reportId } = router.query;

  const [etapa, setEtapa] = useState('form');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [itens, setItens] = useState([]);
  const [novoItem, setNovoItem] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [finalReportId, setFinalReportId] = useState('');
  
  const [form, setForm] = useState({ 
    evento: '', 
    local: '', 
    responsavel: '',
    presentes: '',
    convidados: '',
    observacoes: ''
  });
  
  const areaCapturaRef = useRef();

  useEffect(() => {
    if (reportId) {
      supabase.from('checklists').select('*').eq('id', reportId).single().then(({ data }) => {
        if (data) {
          setForm({ 
            evento: data.evento || '', 
            local: data.local || '', 
            responsavel: data.responsavel || '',
            presentes: data.presentes || '',
            convidados: data.convidados || '',
            observacoes: data.observacoes || ''
          });
          setItens(data.itens || []);
          setFotoUrl(data.foto_url || '');
        }
      });
    } else if (id) {
        supabase.from('eventos').select('nome').eq('id', id).single().then(({ data }) => {
            if (data) setForm(prev => ({ ...prev, evento: data.nome }));
        });
    }
  }, [reportId, id]);

  const handleFotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `pertences/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('fotos').upload(filePath, file);
        if (!uploadError) {
          const { data } = supabase.storage.from('fotos').getPublicUrl(filePath);
          setFotoUrl(data.publicUrl);
        }
    } catch (err) { console.error(err); }
    setUploading(false);
  };

  const salvarETerminar = async () => {
    setLoading(true);
    try {
      // 1. SALVA OS DADOS PRIMEIRO E GARANTE O SUCESSO
      const dadosParaSalvar = { 
          ...form, 
          itens, 
          foto_url: fotoUrl,
          evento_id: id 
      };
      
      let res;
      if (reportId) { 
          res = await supabase.from('checklists').update(dadosParaSalvar).eq('id', reportId).select(); 
      } else { 
          res = await supabase.from('checklists').insert([dadosParaSalvar]).select(); 
      }

      if (res.error) throw new Error(res.error.message);
      
      const savedId = res.data[0].id;
      setFinalReportId(savedId);

      // 2. TENTA GERAR O PRINT (Se o celular travar, ele pula isso e não te deixa na mão)
      try {
        const gerarPrint = async () => {
            const canvas = await html2canvas(areaCapturaRef.current, { 
                scale: 1.5, // Mais leve para o celular não travar
                backgroundColor: "#7e7f7f",
                useCORS: true,
                logging: false
            });
            const imagemBlob = await new Promise(res => canvas.toBlob(res, 'image/png'));
            const nomeImg = `rel_${Date.now()}.png`;
            await supabase.storage.from('fotos').upload(nomeImg, imagemBlob);
            const urlImg = supabase.storage.from('fotos').getPublicUrl(nomeImg).data.publicUrl;
            await supabase.from('checklists').update({ pdf_url: urlImg }).eq('id', savedId);
        };

        // Força a tentar por no máximo 5 segundos. Se travar, ele ignora e continua!
        await Promise.race([
            gerarPrint(),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000))
        ]);
      } catch (imgErr) {
        console.log("Ignorou erro de print para destravar o app");
      }

      // FORÇA A TELA DE SUCESSO DE QUALQUER JEITO!
      setEtapa('sucesso');
    } catch (e) { 
        alert("Erro na internet: " + e.message);
        // Em último caso, libera o botão do zap mesmo com erro
        setEtapa('sucesso');
    }
    setLoading(false);
  };

  const enviarWhatsApp = () => {
    // Garante que se o ID falhou, tenta puxar o da URL
    const idParaLink = finalReportId || reportId; 
    const linkApp = `${window.location.origin}/?id=${idParaLink}`;
    const texto = `Olá! Finalizamos a organização dos seus pertences. Tudo foi recolhido com muito cuidado por nossa equipe.\n\n✨ *Seu Relatório Digital:* ${linkApp}\n\nFoi um prazer fazer parte desse sonho.`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#7e7f7f] p-4 flex flex-col items-center font-sans">
      <Head><title>Checklist | Cerimonial Elite</title></Head>
      
      {etapa === 'form' && (
        <div className="w-full max-w-md animate-in fade-in">
          <Link href={`/menu-evento?id=${id}`} className="text-white/50 mb-4 flex items-center gap-2 text-xs uppercase font-bold tracking-widest"><ArrowLeft size={16}/> Voltar</Link>
          <div className="flex flex-col items-center w-full mb-6 text-center">
            {/* CROSSORIGIN ADICIONADO PARA DESTRAVAR O IPHONE */}
            <img crossOrigin="anonymous" src="https://rticfwqptlxkpgawpzwf.supabase.co/storage/v1/object/public/fotos/logo.png" className="h-16 mb-4" />
            <div className="w-full flex justify-end pr-2">
               <Link href={`/historico?id=${id}`} className="text-white/80 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">VER GERENCIAMENTO <ExternalLink size={12}/></Link>
            </div>
          </div>
          <div className="bg-white rounded-[30px] p-8 shadow-xl">
            <h2 className="text-center font-bold text-gray-500 mb-8 uppercase text-xs tracking-widest">Novo Checklist</h2>
            <div className="space-y-5">
              <input className="w-full border-b p-2 outline-none text-sm" placeholder="Evento" value={form.evento} onChange={e=>setForm({...form, evento: e.target.value})} />
              <input className="w-full border-b p-2 outline-none text-sm" placeholder="Local" value={form.local} onChange={e=>setForm({...form, local: e.target.value})} />
              <div className="flex gap-4">
                  <input className="w-full border-b p-2 outline-none text-sm" placeholder="Presentes" value={form.presentes} onChange={e=>setForm({...form, presentes: e.target.value})} />
                  <input className="w-full border-b p-2 outline-none text-sm" placeholder="Convidados" value={form.convidados} onChange={e=>setForm({...form, convidados: e.target.value})} />
              </div>
              <div className="pt-2">
                <div className="flex gap-2">
                  <input className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-xs outline-none" placeholder="Adicionar Item..." value={novoItem} onChange={e=>setNovoItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (setItens([...itens, novoItem]), setNovoItem(''))} />
                  <button onClick={() => { if(novoItem){ setItens([...itens, novoItem]); setNovoItem(''); } }} className="bg-[#ded0b8] p-2 rounded-xl text-white"><Plus size={16}/></button>
                </div>
                <ul className="text-xs space-y-1 mt-3">
                  {itens.map((it, i) => <li key={i} className="bg-gray-50 p-3 rounded-xl flex justify-between items-center italic text-gray-400">• {it} <Trash2 size={14} onClick={()=>setItens(itens.filter((_,idx)=>idx!==i))} className="text-red-200"/></li>)}
                </ul>
              </div>
              <textarea className="w-full border rounded-2xl p-4 text-sm min-h-[80px]" placeholder="Observações..." value={form.observacoes} onChange={e => setForm({...form, observacoes: e.target.value})}></textarea>
              <input className="w-full border-b p-2 outline-none text-sm" placeholder="Sua Assinatura" value={form.responsavel} onChange={e=>setForm({...form, responsavel: e.target.value})} />
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-2xl cursor-pointer overflow-hidden">
                {uploading ? <Loader2 className="animate-spin"/> : fotoUrl ? <img crossOrigin="anonymous" src={fotoUrl} className="h-full w-full object-cover"/> : <div className="text-gray-300 flex flex-col items-center"><Camera size={24}/><span className="text-[9px] uppercase font-bold tracking-widest">Foto dos Pertences</span></div>}
                <input type="file" className="hidden" accept="image/*" onChange={handleFotoUpload} />
              </label>
              <button onClick={() => setEtapa('resumo')} className="w-full bg-[#ded0b8] text-white font-bold py-4 rounded-2xl mt-4 uppercase text-xs tracking-widest shadow-lg">Visualizar Esboço</button>
            </div>
          </div>
        </div>
      )}

      {etapa === 'resumo' && (
        <div className="w-full flex flex-col items-center pb-24 animate-in fade-in">
          <div ref={areaCapturaRef} className="w-[380px] bg-[#7e7f7f] p-6 flex flex-col items-center">
            {/* CROSSORIGIN ADICIONADO AQUI TAMBÉM */}
            <img crossOrigin="anonymous" src="https://rticfwqptlxkpgawpzwf.supabase.co/storage/v1/object/public/fotos/logo.png" className="max-w-[120px] mb-6" />
            <div className="w-full bg-white rounded-[25px] p-8 text-gray-700 text-xs shadow-sm">
                <h2 className="text-center font-bold text-lg mb-6 uppercase tracking-[5px] text-[#7e7f7f]">Relatório</h2>
                <p className="border-b pb-2 mb-2 uppercase"><strong>EVENTO:</strong> {form.evento}</p>
                <p className="border-b pb-2 mb-2 uppercase"><strong>LOCAL:</strong> {form.local}</p>
                <div className="mt-4 font-bold text-gray-400">ITENS RECOLHIDOS:</div>
                <ul className="italic text-gray-400 mb-4 pl-2 space-y-1">{itens.map((it, i) => <li key={i}>• {it}</li>)}</ul>
                {fotoUrl && <img crossOrigin="anonymous" src={fotoUrl} className="w-full rounded-xl mb-4" />}
                <p className="border-t pt-4"><strong>RESPONSÁVEL:</strong> {form.responsavel}</p>
            </div>
          </div>
          <div className="fixed bottom-0 bg-white p-4 flex gap-2 w-full max-w-md rounded-t-3xl shadow-2xl">
            <button onClick={() => setEtapa('form')} className="flex-1 bg-gray-50 py-4 rounded-2xl text-xs font-bold uppercase text-gray-400">Ajustar</button>
            <button onClick={salvarETerminar} className="flex-2 bg-[#8da38d] text-white py-4 px-8 rounded-2xl text-xs font-bold uppercase shadow-lg flex justify-center items-center">
                {loading ? <Loader2 className="animate-spin"/> : "Confirmar e Enviar"}
            </button>
          </div>
        </div>
      )}

      {etapa === 'sucesso' && (
        <div className="bg-white rounded-[40px] p-10 text-center shadow-2xl max-w-xs mt-20">
          <div className="text-5xl mb-4">✨</div>
          <h2 className="text-gray-500 font-bold uppercase text-sm mb-10">Relatório Criado!</h2>
          <button onClick={enviarWhatsApp} className="w-full bg-[#25D366] text-white py-4 rounded-2xl font-bold text-xs uppercase flex items-center justify-center gap-2 mb-4 shadow-lg">
            <Send size={16}/> Enviar no WhatsApp
          </button>
          <button onClick={() => router.push(`/menu-evento?id=${id}`)} className="w-full text-gray-400 py-4 text-[10px] font-bold uppercase">Voltar ao Menu</button>
        </div>
      )}
    </div>
  );
}
