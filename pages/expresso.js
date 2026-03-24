import { useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import html2canvas from 'html2canvas';
import { Camera, Plus, Trash2, Send, Loader2 } from 'lucide-react';

const supabase = createClient(
  'https://rticfwqptlxkpgawpzwf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0aWNmd3FwdGx4a3BnYXdwendmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDA2MTEsImV4cCI6MjA4OTQxNjYxMX0.vOmi-rKKxXuZ5SP7uZe81Cr0fKW_fWN4Hmuf90soijM'
);

export default function ChecklistExpresso() {
  const [etapa, setEtapa] = useState('form');
  const [loading, setLoading] = useState(false);
  const [itens, setItens] = useState([]);
  const [novoItem, setNovoItem] = useState('');
  const [form, setForm] = useState({ evento: '', local: '', responsavel: '' });
  const [imgUrl, setImgUrl] = useState('');
  const [finalId, setFinalId] = useState('');
  const areaRef = useRef();

  const finalizar = async () => {
    setLoading(true);
    try {
      const canvas = await html2canvas(areaRef.current, { scale: 2, backgroundColor: "#7e7f7f" });
      const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
      const nome = `fds_${Date.now()}.png`;
      await supabase.storage.from('fotos').upload(nome, blob);
      const publicUrl = supabase.storage.from('fotos').getPublicUrl(nome).data.publicUrl;

      const { data } = await supabase.from('checklists').insert([{ ...form, itens, pdf_url: publicUrl }]).select();
      if (data) {
        setFinalId(data[0].id);
        setImgUrl(publicUrl);
        setEtapa('sucesso');
      }
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  if (etapa === 'sucesso') return (
    <div className="min-h-screen bg-[#7e7f7f] p-10 text-center flex flex-col items-center justify-center font-sans">
      <div className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-xs">
        <div className="text-5xl mb-4">✨</div>
        <h2 className="text-gray-500 font-bold uppercase text-sm tracking-widest mb-10">Relatório Pronto!</h2>
        <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent('Olá! Aqui está o seu relatório digital: ' + window.location.origin + '/?id=' + finalId)}`)} className="w-full bg-[#25D366] text-white py-4 rounded-2xl font-bold text-xs uppercase flex items-center justify-center gap-2 mb-4">
          <Send size={16}/> Enviar no WhatsApp
        </button>
        <button onClick={() => window.location.reload()} className="text-gray-400 text-[10px] font-bold uppercase">Novo Relatório</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#7e7f7f] p-4 flex flex-col items-center font-sans">
      <img src="https://rticfwqptlxkpgawpzwf.supabase.co/storage/v1/object/public/fotos/logo.png" className="max-w-[120px] mb-8 mt-6" />
      
      {etapa === 'form' ? (
        <div className="bg-white rounded-[30px] p-8 shadow-xl w-full max-w-md">
          <h2 className="text-center font-bold text-gray-500 mb-6 uppercase text-sm tracking-widest border-b pb-4">Checklist FDS</h2>
          <div className="space-y-4">
            <input className="w-full border-b p-2 outline-none text-sm text-gray-600" placeholder="Nome do Evento" value={form.evento} onChange={e=>setForm({...form, evento: e.target.value})} />
            <input className="w-full border-b p-2 outline-none text-sm text-gray-600" placeholder="Local" value={form.local} onChange={e=>setForm({...form, local: e.target.value})} />
            <div className="flex gap-2">
              <input className="flex-1 bg-gray-50 rounded-lg px-3 text-xs" placeholder="Adicionar item..." value={novoItem} onChange={e=>setNovoItem(e.target.value)} />
              <button onClick={() => { if(novoItem.trim()){ setItens([...itens, novoItem.trim()]); setNovoItem(''); } }} className="bg-[#ded0b8] p-2 rounded-lg text-white"><Plus size={16}/></button>
            </div>
            <ul className="text-xs space-y-1">{itens.map((it, i) => <li key={i} className="bg-gray-50 p-2 rounded flex justify-between italic text-gray-400">• {it} <Trash2 size={14} onClick={()=>setItens(itens.filter((_,idx)=>idx!==i))} className="text-red-200"/></li>)}</ul>
            <input className="w-full border-b p-2 outline-none text-sm text-gray-600" placeholder="Sua Assinatura" value={form.responsavel} onChange={e=>setForm({...form, responsavel: e.target.value})} />
            <button onClick={() => setEtapa('resumo')} className="w-full bg-[#ded0b8] text-white font-bold py-4 rounded-2xl mt-4 uppercase text-xs tracking-widest shadow-lg">Gerar Relatório</button>
          </div>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center pb-20">
          <div ref={areaRef} className="w-[380px] bg-[#7e7f7f] p-6 flex flex-col items-center">
            <img src="https://rticfwqptlxkpgawpzwf.supabase.co/storage/v1/object/public/fotos/logo.png" className="max-w-[120px] mb-6" />
            <div className="w-full bg-white rounded-[25px] p-8 text-gray-700 text-xs shadow-sm">
                <h2 className="text-center font-bold text-lg mb-6 uppercase tracking-[5px] text-[#7e7f7f]">Relatório</h2>
                <p className="border-b pb-2 mb-2 uppercase"><strong>EVENTO:</strong> {form.evento}</p>
                <p className="border-b pb-2 mb-2 uppercase"><strong>LOCAL:</strong> {form.local}</p>
                <div className="mt-4 font-bold">ITENS RECOLHIDOS:</div>
                <ul className="italic text-gray-400 mb-6 pl-2">{itens.map((it, i) => <li key={i}>• {it}</li>)}</ul>
                <p className="border-t pt-4"><strong>ASSINATURA:</strong> {form.responsavel}</p>
            </div>
          </div>
          <div className="fixed bottom-0 bg-white p-4 flex gap-2 w-full max-w-md rounded-t-3xl shadow-2xl">
            <button onClick={() => setEtapa('form')} className="flex-1 bg-gray-50 py-4 rounded-2xl text-xs font-bold uppercase text-gray-400">Ajustar</button>
            <button onClick={finalizar} className="flex-2 bg-[#8da38d] text-white py-4 px-8 rounded-2xl text-xs font-bold uppercase shadow-lg">
                {loading ? <Loader2 className="animate-spin mx-auto"/> : "Confirmar e Enviar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
