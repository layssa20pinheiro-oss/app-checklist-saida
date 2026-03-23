import { useRouter } from 'next/router';
import { useState, useRef, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import html2canvas from 'html2canvas';
import { Camera, Plus, Trash2, Send, Loader2, ArrowLeft } from 'lucide-react';
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
  const [itens, setItens] = useState([]);
  const [novoItem, setNovoItem] = useState('');
  const [form, setForm] = useState({ evento: '', local: '', responsavel: '' });
  const [finalReportId, setFinalReportId] = useState('');
  const areaCapturaRef = useRef();

  useEffect(() => {
    if (reportId) {
      supabase.from('checklists').select('*').eq('id', reportId).single().then(({ data }) => {
        if (data) {
          setForm({ evento: data.evento, local: data.local, responsavel: data.responsavel });
          setItens(data.itens || []);
        }
      });
    }
  }, [reportId]);

  const salvarETerminar = async () => {
    setLoading(true);
    try {
      const canvas = await html2canvas(areaCapturaRef.current, { scale: 2, backgroundColor: "#7e7f7f" });
      const imagemBlob = await new Promise(res => canvas.toBlob(res, 'image/png'));
      const nomeImg = `rel_${Date.now()}.png`;
      await supabase.storage.from('fotos').upload(nomeImg, imagemBlob);
      const urlImg = supabase.storage.from('fotos').getPublicUrl(nomeImg).data.publicUrl;

      const dados = { ...form, itens, pdf_url: urlImg, evento_id: id };
      
      let res;
      if (reportId) { res = await supabase.from('checklists').update(dados).eq('id', reportId).select(); }
      else { res = await supabase.from('checklists').insert([dados]).select(); }

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
          <div className="bg-white rounded-[30px] p-8 shadow-xl">
            <h2 className="text-center font-bold text-gray-500 mb-6 uppercase text-sm tracking-widest">{reportId ? "Editar Relatório" : "Novo Checklist"}</h2>
            <div className="space-y-4">
              <input className="w-full border-b p-2 outline-none text-sm" placeholder="Evento" value={form.evento} onChange={e=>setForm({...form, evento: e.target.value})} />
              <input className="w-full border-b p-2 outline-none text-sm" placeholder="Local" value={form.local} onChange={e=>setForm({...form, local: e.target.value})} />
              <div className="flex gap-2">
                <input className="flex-1 bg-gray-50 rounded-lg px-3 text-xs" placeholder="Item..." value={novoItem} onChange={e=>setNovoItem(e.target.value)} />
                <button onClick={() => { if(novoItem.trim()){ setItens([...itens, novoItem.trim()]); setNovoItem(''); } }} className="bg-[#ded0b8] p-2 rounded-lg text-white"><Plus size={16}/></button>
              </div>
              <ul className="text-xs space-y-1">
                {itens.map((it, i) => <li key={i} className="bg-gray-50 p-2 rounded flex justify-between italic text-gray-500">• {it} <Trash2 size={14} onClick={()=>setItens(itens.filter((_,idx)=>idx!==i))} className="text-red-200"/></li>)}
              </ul>
              <input className="w-full border-b p-2 outline-none text-sm" placeholder="Sua Assinatura" value={form.responsavel} onChange={e=>setForm({...form, responsavel: e.target.value})} />
              <button onClick={() => setEtapa('resumo')} className="w-full bg-[#ded0b8] text-white font-bold py-4 rounded-2xl mt-4 uppercase text-xs tracking-widest shadow-lg">Visualizar Esboço</button>
            </div>
          </div>
        </div>
      )}

      {etapa === 'resumo' && (
        <div className="w-full flex flex-col items-center pb-20">
          <div ref={areaCapturaRef} className="w-[380px] bg-[#7e7f7f] p-6 flex flex-col items-center">
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
            <button onClick={salvarETerminar} className="flex-2 bg-[#8da38d] text-white py-4 px-8 rounded-2xl text-xs font-bold uppercase shadow-lg">
                {loading ? <Loader2 className="animate-spin mx-auto"/> : "Confirmar e Enviar"}
            </button>
          </div>
        </div>
      )}

      {etapa === 'sucesso' && (
        <div className="bg-white rounded-[40px] p-10 text-center shadow-2xl max-w-xs mt-20">
          <div className="text-5xl mb-4">✨</div>
          <h2 className="text-gray-500 font-bold uppercase text-sm tracking-widest mb-10">Relatório Criado!</h2>
          <button onClick={enviarWhatsApp} className="w-full bg-[#25D366] text-white py-4 rounded-2xl font-bold text-xs uppercase flex items-center justify-center gap-2 mb-4 shadow-lg">
            <Send size={16}/> Enviar no WhatsApp
          </button>
          <button onClick={() => router.push(`/menu-evento?id=${id}`)} className="w-full text-gray-400 py-4 text-[10px] font-bold uppercase tracking-widest">Voltar ao Menu</button>
        </div>
      )}
    </div>
  );
}
