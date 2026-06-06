import { useState, useRef, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Camera, Plus, Trash2, Send, Loader2, ExternalLink } from 'lucide-react';
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
  const [fotoUrl, setFotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [reportId, setReportId] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ evento: '', local: '', presentes: '', convidados: '', observacoes: '', responsavel: '' });
  const areaCapturaRef = useRef();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idRel = params.get('id');
    const editMode = params.get('edit');
    if (idRel) {
      setLoading(true);
      supabase.from('checklists').select('*').eq('id', idRel).single().then(({ data }) => {
        if (data) {
          setForm({
             evento: data.evento || '',
             local: data.local || '',
             presentes: data.presentes || '',
             convidados: data.convidados || '',
             observacoes: data.observacoes || data.obs || '',
             responsavel: data.responsavel || ''
          });
          setItens(data.itens || []);
          setFotoUrl(data.foto_url || '');
          setReportId(data.id);
          if (editMode === 'true') { setIsEditing(true); setEtapa('form'); }
          else { setEtapa('view'); }
        }
        setLoading(false);
      });
    }
  }, []);

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

  const salvarRelatorio = async () => {
    if (!form.evento || !form.responsavel) return alert("Preencha o evento e a assinatura.");
    setLoading(true);
    try {
      const dadosParaSalvar = {
        evento: form.evento,
        local: form.local,
        responsavel: form.responsavel,
        observacoes: form.observacoes,
        obs: form.observacoes,
        itens: itens,
        foto_url: fotoUrl,
        pdf_url: 'link-pendente'
      };

      // O FILTRO MÁGICO: Transforma traços e letras em vazio para não quebrar o banco!
      if (form.presentes) {
          const numPresentes = form.presentes.toString().replace(/\D/g, ''); 
          if (numPresentes !== '') dadosParaSalvar.presentes = parseInt(numPresentes);
      }

      if (form.convidados) {
          const numConvidados = form.convidados.toString().replace(/\D/g, ''); 
          if (numConvidados !== '') dadosParaSalvar.convidados = parseInt(numConvidados);
      }

      let res = isEditing
        ? await supabase.from('checklists').update(dadosParaSalvar).eq('id', reportId).select()
        : await supabase.from('checklists').insert([dadosParaSalvar]).select();

      if (res.error) {
          alert("Erro do banco: " + res.error.message);
          setLoading(false);
          return;
      }

      if (res.data) {
          setReportId(res.data[0].id);
          setEtapa('sucesso');
      }
    } catch (e) {
        alert("Erro: " + e.message);
    }
    setLoading(false);
  };

  const enviarWhatsApp = () => {
    const link = `${window.location.origin}/?id=${reportId}`;
    const texto = `Olá! Finalizamos a organização dos seus pertences. Tudo foi recolhido com muito cuidado por nossa equipe.\n\n✨ *Seu Relatório Digital:* ${link}\n\nFoi um prazer fazer parte desse sonho.`;
    window.location.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`;
  };

  return (
    <div className="min-h-screen bg-[#7e7f7f] p-4 flex flex-col items-center font-sans text-slate-800 pb-10">
      <Head>
        <title>Cerimonial Elite</title>
      </Head>

      {etapa === 'form' && (
         <img crossOrigin="anonymous" src="https://rticfwqptlxkpgawpzwf.supabase.co/storage/v1/object/public/fotos/logo.png" className="max-w-[140px] mb-10 mt-6" alt="Logo Cerimonial" />
      )}

      {etapa === 'form' && (
        <div className="w-full max-w-md animate-in fade-in">
          <div className="flex justify-end mb-4">
             <button onClick={() => window.location.href='/historico'} className="text-white/80 text-[10px] uppercase font-bold flex items-center gap-1">VER GERENCIAMENTO <ExternalLink size={12}/></button>
          </div>
          <div className="bg-white rounded-[35px] p-8 shadow-2xl">
            <h2 className="text-center font-bold text-gray-400 mb-8 uppercase text-xs tracking-[3px]">{isEditing ? "Editar Checklist" : "Novo Checklist"}</h2>
            <div className="space-y-4">
              <input className="w-full border-b p-2 outline-none text-sm" placeholder="Evento" value={form.evento} onChange={e=>setForm({...form, evento: e.target.value})} />
              <input className="w-full border-b p-2 outline-none text-sm" placeholder="Local" value={form.local} onChange={e=>setForm({...form, local: e.target.value})} />
              <div className="flex gap-4">
                  <input className="w-full border-b p-2 outline-none text-xs" placeholder="Presentes (só números)" value={form.presentes} onChange={e=>setForm({...form, presentes: e.target.value})} />
                  <input className="w-full border-b p-2 outline-none text-xs" placeholder="Convidados (só números)" value={form.convidados} onChange={e=>setForm({...form, convidados: e.target.value})} />
              </div>
              <div className="flex gap-2 pt-2">
                  <input className="flex-1 bg-gray-50 rounded-xl px-4 text-xs outline-none" placeholder="Adicionar item..." value={novoItem} onChange={e=>setNovoItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (setItens([...itens, novoItem]), setNovoItem(''))} />
                  <button onClick={() => { if(novoItem.trim()){ setItens([...itens, novoItem.trim()]); setNovoItem(''); } }} className="bg-[#ded0b8] p-2 rounded-lg text-white shadow-sm"><Plus size={18}/></button>
              </div>
              <ul className="text-xs space-y-2 max-h-32 overflow-y-auto">
                  {itens.map((it, i) => <li key={i} className="bg-gray-50 p-2 rounded-lg flex justify-between italic text-gray-500">• {it} <Trash2 size={14} onClick={()=>setItens(itens.filter((_,idx)=>idx!==i))} className="text-red-200 cursor-pointer"/></li>)}
              </ul>
              <textarea className="w-full border rounded-2xl p-3 text-xs outline-none bg-gray-50/30" placeholder="Observações..." value={form.observacoes} onChange={e=>setForm({...form, observacoes: e.target.value})} rows={3}></textarea>
              <input className="w-full border-b p-2 outline-none text-sm font-bold" placeholder="Sua Assinatura" value={form.responsavel} onChange={e=>setForm({...form, responsavel: e.target.value})} />
              
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-2xl cursor-pointer overflow-hidden mt-4">
                {uploading ? <Loader2 className="animate-spin text-gray-400"/> : fotoUrl ? <img crossOrigin="anonymous" src={fotoUrl} className="h-full w-full object-cover"/> : <div className="text-gray-300 flex flex-col items-center"><Camera size={24}/><span className="text-[9px] uppercase font-bold tracking-widest">Foto dos Pertences</span></div>}
                <input type="file" className="hidden" accept="image/*" onChange={handleFotoUpload} />
              </label>

              <button onClick={() => setEtapa('resumo')} className="w-full bg-[#ded0b8] text-white font-bold py-5 rounded-[20px] mt-4 uppercase text-xs tracking-widest shadow-lg">Visualizar Esboço</button>
            </div>
          </div>
        </div>
      )}

      {etapa === 'resumo' && (
        <div className="w-full flex flex-col items-center pb-24 animate-in fade-in duration-500">
          <div ref={areaCapturaRef} className="w-[380px] bg-[#7e7f7f] p-8 flex flex-col items-center">
            <img crossOrigin="anonymous" src="https://rticfwqptlxkpgawpzwf.supabase.co/storage/v1/object/public/fotos/logo.png" className="max-w-[130px] mb-8" alt="Logo" />
            <div className="w-full bg-white rounded-[30px] p-10 text-gray-700 text-xs shadow-sm leading-relaxed">
                <h2 className="text-center font-bold text-lg mb-8 uppercase tracking-[8px] text-[#7e7f7f] border-b pb-4">Relatório</h2>
                <div className="space-y-4">
                    <p><strong>EVENTO:</strong> <span className="uppercase">{form.evento}</span></p>
                    <p><strong>LOCAL:</strong> <span className="uppercase">{form.local}</span></p>
                    <div className="border-t pt-3 flex justify-between"><p><strong>PRESENTES:</strong> {form.presentes || '-'}</p><p><strong>CONVIDADOS:</strong> {form.convidados || '-'}</p></div>
                    <div className="border-t pt-3 font-bold">ITENS RECOLHIDOS:<ul className="mt-2 italic text-gray-400 pl-2 space-y-1">{itens.map((it, i) => <li key={i}>• {it}</li>)}</ul></div>
                    <p className="border-t pt-3"><strong>OBS:</strong> <span className="italic">{form.observacoes || 'Nenhuma.'}</span></p>
                    {fotoUrl && <img crossOrigin="anonymous" src={fotoUrl} className="w-full rounded-xl mt-4" />}
                    <p className="border-t pt-6 italic mt-4"><strong>ASSINATURA:</strong> <span className="uppercase">{form.responsavel}</span></p>
                </div>
            </div>
          </div>
          <div className="fixed bottom-0 bg-white/90 backdrop-blur-md p-5 flex gap-3 w-full max-w-md rounded-t-[40px] shadow-2xl border-t z-50">
            <button onClick={() => setEtapa('form')} className="flex-1 bg-gray-50 py-5 rounded-2xl text-xs font-bold uppercase text-gray-400 tracking-widest">Ajustar</button>
            <button onClick={salvarRelatorio} className="flex-2 bg-[#8da38d] text-white py-5 px-10 rounded-2xl text-xs font-bold uppercase shadow-lg flex justify-center items-center">
                {loading ? <Loader2 className="animate-spin mx-auto"/> : "Confirmar e Enviar"}
            </button>
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
                 {fotoUrl && <img crossOrigin="anonymous" src={fotoUrl} className="mt-4 rounded-xl w-full border" />}
              </div>
           </div>
           <button onClick={() => window.location.href='/'} className="mt-10 bg-white/10 text-white px-10 py-4 rounded-2xl text-[10px] uppercase font-bold border border-white/20 tracking-widest hover:bg-white/20">Acessar Meu Painel</button>
        </div>
      )}
    </div>
  );
}
