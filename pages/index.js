import { useState, useRef, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import html2canvas from 'html2canvas';
import { Camera, Plus, Trash2, Send, Loader2, ExternalLink, ArrowLeft } from 'lucide-react';
import Head from 'next/head';

const supabase = createClient(
  'https://rticfwqptlxkpgawpzwf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0aWNmd3FwdGx4a3BnYXdwendmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDA2MTEsImV4cCI6MjA4OTQxNjYxMX0.vOmi-rKKxXuZ5SP7uZe81Cr0fKW_fWN4Hmuf90soijM'
);

export default function ChecklistApp() {
  const [etapa, setEtapa] = useState('form'); 
  const [loading, setLoading] = useState(false);
  const [itens, setItens] = useState([]);
  const [novoItem, setNovoItem] = useState('');
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoBlob, setFotoBlob] = useState(null);
  const [reportId, setReportId] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ evento: '', local: '', presentes: '', convidados: '', obs: '', responsavel: '' });
  const areaCapturaRef = useRef();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idRel = params.get('id');
    const editMode = params.get('edit');
    if (idRel) {
      setLoading(true);
      supabase.from('checklists').select('*').eq('id', idRel).single().then(({ data }) => {
        if (data) {
          setForm(data);
          setItens(data.itens || []);
          setReportId(data.id);
          if (editMode === 'true') { setIsEditing(true); setEtapa('form'); }
          else { setFotoPreview(data.pdf_url); setEtapa('view'); }
        }
        setLoading(false);
      });
    }
  }, []);

  const salvarRelatorio = async () => {
    if (!form.evento || !form.responsavel) return alert("Preencha o evento e a assinatura.");
    setLoading(true);
    try {
      const canvas = await html2canvas(areaCapturaRef.current, { scale: 2, backgroundColor: "#7e7f7f" });
      const imagemBlob = await new Promise(res => canvas.toBlob(res, 'image/png'));
      const nomeImg = `rel_${Date.now()}.png`;
      await supabase.storage.from('fotos').upload(nomeImg, imagemBlob);
      const urlRelatorio = supabase.storage.from('fotos').getPublicUrl(nomeImg).data.publicUrl;
      let urlFotoPertences = form.foto_url || null;
      if (fotoBlob) {
        const nomeFoto = `pertences_${Date.now()}.jpg`;
        await supabase.storage.from('fotos').upload(nomeFoto, fotoBlob);
        urlFotoPertences = supabase.storage.from('fotos').getPublicUrl(nomeFoto).data.publicUrl;
      }
      const dados = { ...form, itens, pdf_url: urlRelatorio, foto_url: urlFotoPertences };
      let res = isEditing ? await supabase.from('checklists').update(dados).eq('id', reportId).select() : await supabase.from('checklists').insert([dados]).select();
      if (res.data) { setReportId(res.data[0].id); setEtapa('sucesso'); }
    } catch (e) { alert("Erro: " + e.message); }
    setLoading(false);
  };

  const enviarWhatsApp = () => {
    const link = `${window.location.origin}/?id=${reportId}`;
    const texto = `Olá! Finalizamos a organização e conferência dos seus pertences. Tudo foi recolhido com muito cuidado por nossa equipe. Aqui está o resumo de tudo o que guardamos:\n\n✨ *Seu Relatório Digital:* ${link}\n\nFoi um prazer fazer parte desse sonho.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_top');
  };

  return (
    <div className="min-h-screen bg-[#7e7f7f] p-4 flex flex-col items-center font-sans text-slate-800 pb-10">
      <Head>
        <title>Cerimonial Elite</title>
        {/* URL com "cache bust" para forçar o WhatsApp a ler a imagem certa */}
        <meta property="og:image" content="https://rticfwqptlxkpgawpzwf.supabase.co/storage/v1/object/public/fotos/logo.png?v=2" />
        <meta property="og:title" content="Cerimonial Elite" />
        <meta property="og:description" content="Relatório Digital de Pertences" />
      </Head>
      
      <img src="https://rticfwqptlxkpgawpzwf.supabase.co/storage/v1/object/public/fotos/logo.png" className="max-w-[140px] mb-10 mt-6" />

      {etapa === 'form' && (
        <div className="w-full max-w-md">
           <div className="flex justify-end mb-4">
              <button onClick={() => window.location.href='/historico'} className="text-white/50 text-[10px] uppercase font-bold flex items-center gap-1">VER GERENCIAMENTO <ExternalLink size={12}/></button>
           </div>
           <div className="bg-white rounded-[35px] p-8 shadow-2xl">
            <h2 className="text-center font-bold text-gray-400 mb-8 uppercase text-xs tracking-[3px]">{isEditing ? "Editar Checklist" : "Novo Checklist"}</h2>
            <div className="space-y-4">
              <input className="w-full border-b p-2 outline-none text-sm" placeholder="Evento" value={form.evento} onChange={e=>setForm({...form, evento: e.target.value})} />
              <input className="w-full border-b p-2 outline-none text-sm" placeholder="Local" value={form.local} onChange={e=>setForm({...form, local: e.target.value})} />
              <div className="flex gap-4"><input className="w-full border-b p-2 outline-none text-xs" placeholder="Presentes" value={form.presentes} onChange={e=>setForm({...form, presentes: e.target.value})} /><input className="w-full border-b p-2 outline-none text-xs" placeholder="Convidados" value={form.convidados} onChange={e=>setForm({...form, convidados: e.target.value})} /></div>
              <div className="flex gap-2 pt-2"><input className="flex-1 bg-gray-50 rounded-xl px-4 text-xs outline-none" placeholder="Adicionar item..." value={novoItem} onChange={e=>setNovoItem(e.target.value)} /><button onClick={() => { if(novoItem.trim()){ setItens([...itens, novoItem.trim()]); setNovoItem(''); } }} className="bg-[#ded0b8] p-2 rounded-lg text-white shadow-sm"><Plus size={18}/></button></div>
              <ul className="text-xs space-y-2 max-h-32 overflow-y-auto">{itens.map((it, i) => <li key={i} className="bg-gray-50 p-2 rounded-lg flex justify-between italic text-gray-500">• {it} <Trash2 size={14} onClick={()=>setItens(itens.filter((_,idx)=>idx!==i))} className="text-red-200 cursor-pointer"/></li>)}</ul>
              <textarea className="w-full border rounded-2xl p-3 text-xs outline-none bg-gray-50/30" placeholder="Observações..." value={form.obs} onChange={e=>setForm({...form, obs: e.target.value})} rows={3}></textarea>
              <input className="w-full border-b p-2 outline-none text-sm font-bold" placeholder="Sua Assinatura" value={form.responsavel} onChange={e=>setForm({...form, responsavel: e.target.value})} />
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-2xl p-4 cursor-pointer hover:bg-gray-50 transition-all">
                <Camera className="text-gray-300 mb-1" /><span className="text-[10px] font-bold text-gray-300 uppercase">Foto dos Pertences</span>
                <input type="file" accept="image/*" capture="camera" className="hidden" onChange={(e) => { const file = e.target.files[0]; if (file) { setFotoPreview(URL.createObjectURL(file)); setFotoBlob(file); } }} />
                {fotoPreview && etapa === 'form' && <img src={fotoPreview} className="mt-2 h-16 rounded-lg shadow-sm" />}
              </label>
              <button onClick={() => setEtapa('resumo')} className="w-full bg-[#ded0b8] text-white font-bold py-5 rounded-[20px] mt-4 uppercase text-xs tracking-widest shadow-lg">Visualizar Esboço</button>
            </div>
          </div>
        </div>
      )}

      {etapa === 'resumo' && (
        <div className="w-full flex flex-col items-center pb-24 animate-in fade-in duration-500">
          <div ref={areaCapturaRef} className="w-[380px] bg-[#7e7f7f] p-8 flex flex-col items-center">
            <img src="https://rticfwqptlxkpgawpzwf.supabase.co/storage/v1/object/public/fotos/logo.png" className="max-w-[130px] mb-8" />
            <div className="w-full bg-white rounded-[30px] p-10 text-gray-700 text-xs shadow-sm leading-relaxed">
                <h2 className="text-center font-bold text-lg mb-8 uppercase tracking-[8px] text-[#7e7f7f] border-b pb-4">Relatório</h2>
                <div className="space-y-4">
                    <p><strong>EVENTO:</strong> <span className="uppercase">{form.evento}</span></p>
                    <p><strong>LOCAL:</strong> <span className="uppercase">{form.local}</span></p>
                    <div className="border-t pt-3 flex justify-between"><p><strong>PRESENTES:</strong> {form.presentes || '-'}</p><p><strong>CONVIDADOS:</strong> {form.convidados || '-'}</p></div>
                    <div className="border-t pt-3 font-bold">ITENS RECOLHIDOS:<ul className="mt-2 italic text-gray-400 pl-2 space-y-1">{itens.map((it, i) => <li key={i}>• {it}</li>)}</ul></div>
                    <p><strong>OBS:</strong> <span className="italic">{form.obs || 'Nenhuma.'}</span></p>
                    <p className="border-t pt-6 italic mt-4"><strong>ASSINATURA:</strong> <span className="uppercase">{form.responsavel}</span></p>
                </div>
            </div>
          </div>
          <div className="fixed bottom-0 bg-white/90 backdrop-blur-md p-5 flex gap-3 w-full max-w-md rounded-t-[40px] shadow-2xl border-t z-50">
            <button onClick={() => setEtapa('form')} className="flex-1 bg-gray-50 py-5 rounded-2xl text-xs font-bold uppercase text-gray-400 tracking-widest">Ajustar</button>
            <button onClick={salvarRelatorio} className="flex-2 bg-[#8da38d] text-white py-5 px-10 rounded-2xl text-xs font-bold uppercase shadow-lg">{loading ? <Loader2 className="animate-spin mx-auto"/> : "Confirmar e Enviar"}</button>
          </div>
        </div>
      )}

      {etapa === 'sucesso' && (
        <div className="bg-white rounded-[45px] p-12 text-center shadow-2xl max-w-xs mt-20 animate-in zoom-in">
          <div className="text-6xl mb-6">✨</div>
          <h2 className="text-gray-500 font-bold uppercase text-sm tracking-[3px] mb-10 leading-tight">Relatório Criado!</h2>
          <button onClick={enviarWhatsApp} className="w-full bg-[#25D366] text-white py-5 rounded-2xl font-bold text-xs uppercase flex items-center justify-center gap-3 mb-4 shadow-xl"><Send size={18}/> Enviar no WhatsApp</button>
          <button onClick={() => window.location.href='/'} className="w-full text-gray-400 py-4 text-[10px] font-bold uppercase tracking-widest">Novo Checklist</button>
        </div>
      )}

      {etapa === 'view' && (
        <div className="w-full flex flex-col items-center mt-10">
           <div className="w-[380px] bg-white rounded-[35px] p-8 shadow-2xl text-gray-700">
              <h2 className="text-[#7e7f7f] text-center font-bold text-xl mb-8 uppercase tracking-[5px]">Relatório Digital</h2>
              <div className="space-y-4 text-sm border-t pt-6">
                 <p><strong>EVENTO:</strong> <span className="uppercase">{form.evento}</span></p>
                 <p><strong>LOCAL:</strong> <span className="uppercase">{form.local}</span></p>
                 <div className="border-t pt-4 font-bold uppercase text-[10px] text-gray-400">Itens Recolhidos:</div>
                 <ul className="space-y-1 italic text-gray-500">{itens?.map((it, i) => <li key={i}>• {it}</li>)}</ul>
                 <p className="border-t pt-4 italic"><strong>RESPONSÁVEL:</strong> {form.responsavel}</p>
                 {form.foto_url && <img src={form.foto_url} className="mt-4 rounded-xl w-full border" />}
              </div>
           </div>
           <button onClick={() => window.location.href='/'} className="mt-10 bg-white/10 text-white px-10 py-4 rounded-2xl text-[10px] uppercase font-bold border border-white/20 tracking-widest hover:bg-white/20">Acessar Meu Painel</button>
        </div>
      )}
    </div>
  );
}
