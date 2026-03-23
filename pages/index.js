import { useState, useRef, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import html2canvas from 'html2canvas';
import { Camera, Plus, Trash2, Send, Image as ImageIcon, Edit3, Loader2, ExternalLink, Users, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import Head from 'next/head';

const supabase = createClient(
  'https://rticfwqptlxkpgawpzwf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0aWNmd3FwdGx4a3BnYXdwendmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDA2MTEsImV4cCI6MjA4OTQxNjYxMX0.vOmi-rKKxXuZ5SP7uZe81Cr0fKW_fWN4Hmuf90soijM'
);

export default function ChecklistApp() {
  const [etapa, setEtapa] = useState('menu'); 
  const [loading, setLoading] = useState(false);
  const [itens, setItens] = useState([]);
  const [novoItem, setNovoItem] = useState('');
  const [fotoBlob, setFotoBlob] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [imgGeradaUrl, setImgGeradaUrl] = useState('');
  const [reportId, setReportId] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ evento: '', local: '', presentes: '', convidados: '', obs: '', responsavel: '' });

  const areaCapturaRef = useRef();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
      const params = new URLSearchParams(window.location.search);
      const idRel = params.get('id');
      if (idRel) {
        setReportId(idRel);
        const buscarRelatorio = async (idBusca) => {
          setLoading(true);
          const { data } = await supabase.from('checklists').select('*').eq('id', idBusca).single();
          if (data) {
            setForm(data);
            setItens(data.itens || []);
            setFotoPreview(data.foto_url);
            setEtapa(params.get('edit') === 'true' ? 'form' : 'view');
            if (params.get('edit') === 'true') setIsEditing(true);
          }
          setLoading(false);
        };
        buscarRelatorio(idRel);
      }
    }
  }, []);

  const salvarTudo = async () => {
    setLoading(true);
    try {
      const elemento = areaCapturaRef.current;
      const canvas = await html2canvas(elemento, { scale: 2, useCORS: true, backgroundColor: "#7e7f7f", windowWidth: 500 });
      const imagemFinalBlob = await new Promise(res => canvas.toBlob(res, 'image/png'));
      const nomeArquivo = `relatorio_${Date.now()}.png`;
      await supabase.storage.from('fotos').upload(nomeArquivo, imagemFinalBlob);
      const urlImgGerada = supabase.storage.from('fotos').getPublicUrl(nomeArquivo).data.publicUrl;
      setImgGeradaUrl(urlImgGerada);

      let fotoOriginalUrl = fotoPreview;
      if (fotoBlob) {
        const nomeFoto = `original_${Date.now()}.jpg`;
        await supabase.storage.from('fotos').upload(nomeFoto, fotoBlob);
        fotoOriginalUrl = supabase.storage.from('fotos').getPublicUrl(nomeFoto).data.publicUrl;
      }

      const dados = { ...form, itens, foto_url: fotoOriginalUrl, pdf_url: urlImgGerada };
      if (isEditing) { await supabase.from('checklists').update(dados).eq('id', reportId); }
      else { 
        const { data } = await supabase.from('checklists').insert([dados]).select();
        setReportId(data[0].id);
      }
      setEtapa('sucesso');
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  const shareWhatsApp = () => {
    const link = `${baseUrl}/?id=${reportId}`;
    const texto = `Olá! Finalizamos a organização e conferência dos seus pertences. Tudo foi recolhido com muito cuidado por nossa equipe.\n\n✨ *Seu Relatório Digital:* ${link}\n\nFoi um prazer fazer parte desse sonho.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_top');
  };

  return (
    <div className="min-h-screen bg-[#7e7f7f] p-4 flex flex-col items-center font-sans text-slate-800 pb-10">
      <Head>
        <title>Cerimonial Elite</title>
        <link rel="icon" href="/icon.png" />
      </Head>

      {/* TELA DE MENU INICIAL - ATUALIZADA */}
      {etapa === 'menu' && (
        <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
          <img src="https://rticfwqptlxkpgawpzwf.supabase.co/storage/v1/object/public/fotos/logo.png" className="max-w-[160px] mx-auto mb-10 mt-10" alt="Logo" />
          
          <div className="grid grid-cols-1 gap-4">
            <button onClick={() => setEtapa('form')} className="bg-white p-6 rounded-[30px] shadow-xl flex items-center gap-4 hover:scale-105 transition-all text-left group">
              <div className="bg-[#ded0b8] p-4 rounded-2xl text-white group-hover:bg-[#8da38d] transition-colors"><ClipboardList /></div>
              <div>
                <h3 className="font-bold text-gray-700 uppercase tracking-widest text-sm">Novo Relatório</h3>
                <p className="text-[10px] text-gray-400 uppercase tracking-tighter italic">Checklist de Saída</p>
              </div>
            </button>

            <Link href="/lista" className="bg-white p-6 rounded-[30px] shadow-xl flex items-center gap-4 hover:scale-105 transition-all text-left group">
              <div className="bg-[#ded0b8] p-4 rounded-2xl text-white group-hover:bg-[#8da38d] transition-colors"><Users /></div>
              <div>
                <h3 className="font-bold text-gray-700 uppercase tracking-widest text-sm">Gestão de Convidados</h3>
                <p className="text-[10px] text-gray-400 uppercase tracking-tighter italic">Lista, RSVP e Portaria</p>
              </div>
            </Link>

            <Link href="/historico" className="bg-white/10 p-4 rounded-2xl border border-white/20 text-white flex items-center justify-center gap-2 mt-4 hover:bg-white/20 transition-all">
              <ExternalLink size={16} /> <span className="text-[10px] font-bold uppercase tracking-widest">Histórico de Relatórios</span>
            </Link>
          </div>
        </div>
      )}

      {/* --- FORMULÁRIO DO CHECKLIST --- */}
      {etapa === 'form' && (
        <div className="w-full max-w-md">
           <button onClick={() => setEtapa('menu')} className="text-white/50 mb-4 flex items-center gap-2 text-xs uppercase font-bold tracking-widest"> Voltar ao Menu</button>
           <div className="bg-white rounded-[30px] p-8 shadow-xl">
            <h2 className="text-center font-bold text-gray-500 mb-6 uppercase tracking-widest text-sm">
              {isEditing ? "Editar Relatório" : "Novo Checklist"}
            </h2>
            <div className="space-y-4">
              <input className="w-full border-b p-2 outline-none" placeholder="Evento" value={form.evento} onChange={e=>setForm({...form, evento: e.target.value})} />
              <input className="w-full border-b p-2 outline-none" placeholder="Local" value={form.local} onChange={e=>setForm({...form, local: e.target.value})} />
              <div className="flex gap-4">
                <input type="number" className="w-full border-b p-2 outline-none text-xs" placeholder="Presentes" value={form.presentes} onChange={e=>setForm({...form, presentes: e.target.value})} />
                <input type="number" className="w-full border-b p-2 outline-none text-xs" placeholder="Convidados" value={form.convidados} onChange={e=>setForm({...form, convidados: e.target.value})} />
              </div>
              <div className="flex gap-2">
                <input className="flex-1 bg-gray-50 rounded-lg px-3 text-xs" placeholder="Adicionar item..." value={novoItem} onChange={e=>setNovoItem(e.target.value)} />
                <button onClick={() => { if(novoItem.trim()) { setItens([...itens, novoItem.trim()]); setNovoItem(''); } }} className="bg-[#ded0b8] p-2 rounded-lg text-white"><Plus size={16}/></button>
              </div>
              <ul className="text-sm space-y-1">
                {itens.map((it, i) => <li key={i} className="bg-gray-50 p-2 rounded flex justify-between text-xs uppercase italic"> • {it} <Trash2 size={14} onClick={()=>setItens(itens.filter((_,idx)=>idx!==i))} className="text-red-300"/></li>)}
              </ul>
              <textarea className="w-full border rounded-lg p-2 text-xs" placeholder="Observações..." value={form.obs} onChange={e=>setForm({...form, obs: e.target.value})}></textarea>
              <input className="w-full border-b p-2 outline-none text-xs" placeholder="Assinatura Responsável" value={form.responsavel} onChange={e=>setForm({...form, responsavel: e.target.value})} />
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#ded0b8] rounded-2xl p-4 cursor-pointer">
                <Camera className="text-gray-400 mb-1" />
                <span className="text-[10px] font-bold text-gray-400 uppercase">FOTO DOS ITENS</span>
                <input type="file" accept="image/*" capture="camera" className="hidden" onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) { setFotoPreview(URL.createObjectURL(file)); setFotoBlob(file); }
                }} />
                {fotoPreview && <img src={fotoPreview} className="mt-2 h-24 rounded-lg shadow-sm" alt="Preview" />}
              </label>
              <button onClick={() => setEtapa('resumo')} className="w-full bg-[#ded0b8] text-white font-bold py-4 rounded-2xl mt-4 shadow-lg active:scale-95 transition-all uppercase tracking-wider text-xs">VISUALIZAR ESBOÇO</button>
            </div>
          </div>
        </div>
      )}

      {(etapa === 'resumo' || etapa === 'view') && (
        <div className="w-full flex flex-col items-center pb-20">
          <div ref={areaCapturaRef} className="w-[400px] bg-[#7e7f7f] p-6 flex flex-col items-center">
            <img src="https://rticfwqptlxkpgawpzwf.supabase.co/storage/v1/object/public/fotos/logo.png" className="max-w-[130px] mb-6" alt="Logo" />
            <div className="w-full bg-white rounded-[25px] p-8 shadow-sm text-gray-700">
              <h2 className="text-[#7e7f7f] text-center font-bold text-lg mb-6 uppercase tracking-widest">Relatório</h2>
              <div className="space-y-3 text-xs leading-relaxed">
                <p><strong>EVENTO:</strong> {form.evento}</p>
                <p><strong>LOCAL:</strong> {form.local}</p>
                <div className="border-t pt-2 flex justify-between">
                   <p><strong>PRESENTES:</strong> {form.presentes}</p>
                   <p><strong>CONVIDADOS:</strong> {form.convidados}</p>
                </div>
                <div className="border-t pt-2">
                  <strong>ITENS RECOLHIDOS:</strong>
                  <ul className="mt-1 space-y-1 italic text-gray-500">
                    {itens.map((it, i) => <li key={i}>• {it}</li>)}
                  </ul>
                </div>
                <p className="border-t pt-2"><strong>OBSERVAÇÕES:</strong> {form.obs || 'Nenhuma.'}</p>
                <p className="border-t pt-2 italic"><strong>RESPONSÁVEL:</strong> {form.responsavel}</p>
                {fotoPreview && <img src={fotoPreview} className="mt-5 rounded-xl w-full border" alt="Foto" />}
              </div>
            </div>
          </div>
          {etapa === 'resumo' && (
            <div className="fixed bottom-0 left-0 right-0 bg-white p-4 flex gap-3 w-full max-w-lg mx-auto rounded-t-3xl border shadow-2xl z-50">
              <button onClick={() => setEtapa('form')} className="flex-1 bg-gray-50 text-gray-500 font-bold py-4 rounded-2xl text-xs uppercase">Ajustar</button>
              <button onClick={salvarTudo} disabled={loading} className="flex-2 bg-[#8da38d] text-white font-bold py-4 px-8 rounded-2xl text-xs uppercase">
                {loading ? <Loader2 className="animate-spin" /> : (isEditing ? "Atualizar" : "Confirmar")}
              </button>
            </div>
          )}
        </div>
      )}

      {etapa === 'sucesso' && (
        <div className="w-full max-w-md bg-white rounded-[30px] p-10 shadow-2xl text-center mt-10">
          <div className="text-5xl mb-4">✨</div>
          <h2 className="text-gray-500 text-xl font-bold mb-6 tracking-widest uppercase">Gerado!</h2>
          <div className="space-y-4">
            <button onClick={shareWhatsApp} className="w-full bg-[#25D366] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2"><Send size={18}/> MANDAR NO WHATSAPP</button>
            <a href={imgGeradaUrl} target="_blank" rel="noreferrer" className="w-full bg-gray-400 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2"><ImageIcon size={18}/> VER IMAGEM</a>
            <button onClick={() => setEtapa('menu')} className="w-full text-gray-400 font-bold py-4 text-[10px] tracking-widest uppercase">Voltar ao Menu</button>
          </div>
        </div>
      )}
    </div>
  );
}
