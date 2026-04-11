import { useRouter } from 'next/router';
import { useState, useRef, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import html2canvas from 'html2canvas';
import { Camera, Plus, Trash2, Send, Loader2, ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';

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
  
  const [form, setForm] = useState({ 
    evento: '', 
    local: '', 
    responsavel: '',
    presentes: '',
    convidados: '',
    observacoes: ''
  });
  
  const [fotoUrl, setFotoUrl] = useState('');
  const [finalReportId, setFinalReportId] = useState('');
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
        supabase.from('eventos').select('*').eq('id', id).single().then(({ data }) => {
            if (data) setForm(prev => ({ ...prev, evento: data.nome }));
        });
    }
  }, [reportId, id]);

  const handleFotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `pertences/${fileName}`;
    const { error: uploadError } = await supabase.storage.from('fotos').upload(filePath, file);
    if (!uploadError) {
      const { data } = supabase.storage.from('fotos').getPublicUrl(filePath);
      setFotoUrl(data.publicUrl);
    } else {
      alert("Erro ao enviar foto: " + uploadError.message);
    }
    setUploading(false);
  };

  const salvarETerminar = async () => {
    setLoading(true);
    try {
      const canvas = await html2canvas(areaCapturaRef.current, { scale: 2, backgroundColor: "#7e7f7f" });
      const imagemBlob = await new Promise(res => canvas.toBlob(res, 'image/png'));
      const nomeImg = `rel_${Date.now()}.png`;
      await supabase.storage.from('fotos').upload(nomeImg, imagemBlob);
      const urlImg = supabase.storage.from('fotos').getPublicUrl(nomeImg).data.publicUrl;

      const dados = { ...form, itens, pdf_url: urlImg, foto_url: fotoUrl, evento_id: id };
      let res;
      if (reportId) { 
          res = await supabase.from('checklists').update(dados).eq('id', reportId).select(); 
      } else { 
          res = await supabase.from('checklists').insert([dados]).select(); 
      }
      if (res.data) {
        setFinalReportId(res.data[0].id);
        setEtapa('sucesso');
      }
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  const enviarWhatsApp = () => {
    const linkApp = `${window.location.origin}/?id=${finalReportId}`;
    const texto = `Olá! Finalizamos a organização dos seus pertences. Tudo foi recolhido com muito cuidado por nossa equipe.\n\n✨ *Seu Relatório Digital:* ${linkApp}\n\nFoi um prazer fazer parte desse sonho.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_top');
  };

  return (
    <div className="min-h-screen bg-[#7e7f7f] p-4 flex flex-col items-center font-sans">
      
      {etapa === 'form' && (
        <div className="w-full max-w-md">
          <Link href={`/menu-evento?id=${id}`} className="text-white/50 mb-4 flex items-center gap-2 text-xs uppercase font-bold tracking-widest"><ArrowLeft size={16}/> Voltar</Link>
          
          <div className="flex flex-col items-center w-full mb-6 relative">
            {/* AQUI ESTÁ A PRIMEIRA CORREÇÃO DA IMAGEM */}
            <img src="/icon.png" className="h-16 opacity-90 mb-4" alt="Logo Cerimonial" />
            <div className="w-full flex justify-end pr-2">
               <Link href={`/historico?id=${id}`} className="flex items-center gap-1 text-white/80 hover:text-white text-[9px] font-bold uppercase tracking-widest transition-all">
                 VER GERENCIAMENTO <ExternalLink size={12}/>
               </Link>
            </div>
          </div>

          <div className="bg-white rounded-[30px] p-8 shadow-xl relative">
            <h2 className="text-center font-bold text-gray-500 mb-8 uppercase text-sm tracking-widest mt-2">
                {reportId ? "Editar Relatório" : "Novo Checklist"}
            </h2>
            
            <div className="space-y-5">
              <input className="w-full border-b border-gray-200 p-2 outline-none text-sm text-gray-600 placeholder:text-gray-400" placeholder="Evento" value={form.evento} onChange={e=>setForm({...form, evento: e.target.value})} />
              <input className="w-full border-b border-gray-200 p-2 outline-none text-sm text-gray-600 placeholder:text-gray-400" placeholder="Local" value={form.local} onChange={e=>setForm({...form, local: e.target.value})} />
              
              <div className="flex gap-4">
                  <input className="w-full border-b border-gray-200 p-2 outline-none text-sm text-gray-600 placeholder:text-gray-400" placeholder="Presentes" value={form.presentes} onChange={e=>setForm({...form, presentes: e.target.value})} />
                  <input className="w-full border-b border-gray-200 p-2 outline-none text-sm text-gray-600 placeholder:text-gray-400" placeholder="Convidados" value={form.convidados} onChange={e=>setForm({...form, convidados: e.target.value})} />
              </div>

              <div className="pt-2">
                <div className="flex items-center gap-2">
                  <input className="flex-1 border border-gray-200 bg-gray-50/50 focus-within:border-[#ded0b8] transition-colors rounded-xl px-3 py-2 text-xs outline-none" placeholder="Adicionar Item..." value={novoItem} onChange={e=>setNovoItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && setNovoItem(novoItem.trim() ? (setItens([...itens, novoItem.trim()]), '') : novoItem)} />
                  <button onClick={() => { if(novoItem.trim()){ setItens([...itens, novoItem.trim()]); setNovoItem(''); } }} className="bg-[#ded0b8] p-2.5 rounded-xl text-white shadow-sm"><Plus size={16}/></button>
                </div>
                {itens.length > 0 && (
                    <ul className="text-xs space-y-1 mt-3">
                    {itens.map((it, i) => <li key={i} className="bg-gray-50 p-3 rounded-xl flex justify-between items-center italic text-gray-500 border border-gray-100">• {it} <Trash2 size={14} onClick={()=>setItens(itens.filter((_,idx)=>idx!==i))} className="text-gray-300 hover:text-red-300"/></li>)}
                    </ul>
                )}
              </div>

              <div className="pt-2">
                  <textarea className="w-full border border-gray-200 rounded-2xl p-4 outline-none text-sm text-gray-600 placeholder:text-gray-400 min-h-[80px] resize-none focus:border-[#ded0b8] transition-colors" placeholder="Observações..." value={form.observacoes} onChange={e => setForm({...form, observacoes: e.target.value})}></textarea>
              </div>

              <input className="w-full border-b border-gray-200 p-2 outline-none text-sm text-gray-600 placeholder:text-gray-400 mt-2" placeholder="Sua Assinatura" value={form.responsavel} onChange={e=>setForm({...form, responsavel: e.target.value})} />
              
              <div className="pt-2 pb-2">
                <label className="relative flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 rounded-[20px] cursor-pointer hover:bg-gray-50 transition-colors overflow-hidden group">
                    {uploading ? (
                    <div className="flex flex-col items-center text-gray-400 gap-2"><Loader2 className="animate-spin" size={20}/><span className="text-[9px] uppercase font-bold tracking-widest">Enviando...</span></div>
                    ) : fotoUrl ? (
                    <img src={fotoUrl} className="w-full h-full object-cover opacity-90" />
                    ) : (
                    <div className="flex flex-col items-center text-gray-300 group-hover:text-[#ded0b8] transition-colors gap-2">
                        <Camera size={24} />
                        <span className="text-[9px] uppercase font-bold tracking-widest">Foto dos Pertences</span>
                    </div>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={handleFotoUpload} />
                </label>
              </div>

              <button onClick={() => setEtapa('resumo')} disabled={uploading} className="w-full bg-[#ded0b8] text-white font-bold py-4 rounded-2xl mt-4 uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all">Visualizar Esboço</button>
            </div>
          </div>
        </div>
      )}

      {etapa === 'resumo' && (
        <div className="w-full flex flex-col items-center pb-24">
          <div ref={areaCapturaRef} className="w-[380px] bg-[#7e7f7f] p-6 flex flex-col items-center">
            {/* AQUI ESTÁ A SEGUNDA CORREÇÃO DA IMAGEM */}
            <img src="/icon.png" className="max-w-[120px] mb-6" alt="Logo Cerimonial" />
            
            <div className="w-full bg-white rounded-[25px] p-8 text-gray-700 text-xs shadow-sm">
                <h2 className="text-center font-bold text-lg mb-6 uppercase tracking-[5px] text-[#7e7f7f]">Relatório</h2>
                <p className="border-b pb-2 mb-2 uppercase"><strong>EVENTO:</strong> {form.evento}</p>
                <p className="border-b pb-2 mb-2 uppercase"><strong>LOCAL:</strong> {form.local}</p>
                {(form.presentes || form.convidados) && (
                    <div className="border-b pb-2 mb-2 flex gap-4 uppercase">
                        {form.presentes && <p><strong>PRESENTES:</strong> {form.presentes}</p>}
                        {form.convidados && <p><strong>CONVIDADOS:</strong> {form.convidados}</p>}
                    </div>
                )}
                <div className="mt-4 font-bold uppercase text-[10px] text-gray-400">ITENS RECOLHIDOS:</div>
                <ul className="italic text-gray-500 mb-4 pl-2 space-y-1 mt-2">{itens.map((it, i) => <li key={i}>• {it}</li>)}</ul>
                {form.observacoes && (
                    <div className="border-t pt-3 mb-4">
                        <span className="font-bold uppercase text-[10px] text-gray-400 block mb-1">OBSERVAÇÕES:</span>
                        <p className="italic text-gray-500">{form.observacoes}</p>
                    </div>
                )}
                {fotoUrl && (
                    <div className="border-t pt-4 mb-4">
                        <span className="font-bold uppercase text-[10px] text-gray-400 block mb-2">FOTO REGISTRADA:</span>
                        <img src={fotoUrl} className="w-full rounded-xl" />
                    </div>
                )}
                <p className="border-t pt-4 uppercase text-gray-600"><strong>RESPONSÁVEL:</strong> {form.responsavel}</p>
            </div>
          </div>
          <div className="fixed bottom-0 bg-white p-4 flex gap-2 w-full max-w-md rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
            <button onClick={() => setEtapa('form')} className="flex-1 bg-gray-100 py-4 rounded-2xl text-xs font-bold uppercase text-gray-500 hover:bg-gray-200 transition-colors">Ajustar</button>
            <button onClick={salvarETerminar} className="flex-2 bg-[#8da38d] text-white py-4 px-8 rounded-2xl text-xs font-bold uppercase shadow-lg active:scale-95 transition-all flex justify-center items-center">
                {loading ? <Loader2 className="animate-spin"/> : "Confirmar e Enviar"}
            </button>
          </div>
        </div>
      )}

      {etapa === 'sucesso' && (
        <div className="bg-white rounded-[40px] p-10 text-center shadow-2xl max-w-xs mt-20 animate-in zoom-in duration-300">
          <div className="text-5xl mb-4">✨</div>
          <h2 className="text-gray-500 font-bold uppercase text-sm tracking-widest mb-10">Relatório Criado!</h2>
          <button onClick={enviarWhatsApp} className="w-full bg-[#25D366] text-white py-4 rounded-2xl font-bold text-xs uppercase flex items-center justify-center gap-2 mb-4 shadow-lg hover:bg-[#20b858] transition-colors">
            <Send size={16}/> Enviar no WhatsApp
          </button>
          <button onClick={() => router.push(`/menu-evento?id=${id}`)} className="w-full text-gray-400 py-4 text-[10px] font-bold uppercase tracking-widest hover:text-gray-600 transition-colors">Voltar ao Menu</button>
        </div>
      )}
    </div>
  );
}
