import { useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import html2canvas from 'html2canvas';
import { Camera, Plus, Trash2, Send, Loader2, ArrowLeft, ClipboardList } from 'lucide-react';

const supabase = createClient(
  'https://rticfwqptlxkpgawpzwf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0aWNmd3FwdGx4a3BnYXdwendmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDA2MTEsImV4cCI6MjA4OTQxNjYxMX0.vOmi-rKKxXuZ5SP7uZe81Cr0fKW_fWN4Hmuf90soijM'
);

export default function ChecklistExpresso() {
  const [etapa, setEtapa] = useState('form'); // form, resumo, sucesso
  const [loading, setLoading] = useState(false);
  const [itens, setItens] = useState([]);
  const [novoItem, setNovoItem] = useState('');
  const [form, setForm] = useState({ evento: '', local: '', responsavel: '', obs: '' });
  const [finalReportId, setFinalReportId] = useState('');
  const areaCapturaRef = useRef();

  // FUNÇÃO PARA SALVAR E GERAR IMAGEM
  const salvarETerminar = async () => {
    setLoading(true);
    try {
      // 1. Gera a imagem do relatório
      const canvas = await html2canvas(areaCapturaRef.current, { scale: 2, backgroundColor: "#7e7f7f" });
      const imagemBlob = await new Promise(res => canvas.toBlob(res, 'image/png'));
      const nomeImg = `fds_${Date.now()}.png`;
      
      // 2. Sobe para o Storage
      await supabase.storage.from('fotos').upload(nomeImg, imagemBlob);
      const urlImg = supabase.storage.from('fotos').getPublicUrl(nomeImg).data.publicUrl;

      // 3. Salva os dados no Banco (sem evento_id fixo para ser rápido)
      const { data, error } = await supabase.from('checklists').insert([{ 
        ...form, 
        itens, 
        pdf_url: urlImg 
      }]).select();

      if (error) throw error;

      if (data) {
        setFinalReportId(data[0].id);
        setEtapa('sucesso');
      }
    } catch (e) { 
      alert("Erro ao processar: " + e.message); 
    }
    setLoading(false);
  };

  const enviarWhatsApp = () => {
    const linkApp = `${window.location.origin}/?id=${finalReportId}`;
    const texto = `Olá! Finalizamos a organização e conferência dos seus pertences. Tudo foi recolhido com muito cuidado por nossa equipe.\n\n✨ *Seu Relatório Digital:* ${linkApp}\n\nFoi um prazer fazer parte desse sonho.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_top');
  };

  return (
    <div className="min-h-screen bg-[#7e7f7f] p-4 flex flex-col items-center font-sans text-slate-800">
      <img src="https://rticfwqptlxkpgawpzwf.supabase.co/storage/v1/object/public/fotos/logo.png" className="max-w-[130px] mb-8 mt-6" alt="Logo" />

      {/* --- ETAPA 1: FORMULÁRIO (CONSTRUÇÃO) --- */}
      {etapa === 'form' && (
        <div className="w-full max-w-md animate-in fade-in duration-500">
          <div className="bg-white rounded-[35px] p-8 shadow-2xl">
            <h2 className="text-center font-bold text-gray-400 mb-8 uppercase text-xs tracking-[3px] border-b pb-4">Checklist de Saída</h2>
            
            <div className="space-y-5">
              <div className="border-b pb-1">
                <label className="text-[10px] font-bold text-[#ded0b8] uppercase tracking-widest">Evento</label>
                <input className="w-full p-1 outline-none text-sm bg-transparent" placeholder="Nome dos Noivos/Debutante" value={form.evento} onChange={e=>setForm({...form, evento: e.target.value})} />
              </div>

              <div className="border-b pb-1">
                <label className="text-[10px] font-bold text-[#ded0b8] uppercase tracking-widest">Local</label>
                <input className="w-full p-1 outline-none text-sm bg-transparent" placeholder="Salão / Buffet" value={form.local} onChange={e=>setForm({...form, local: e.target.value})} />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#ded0b8] uppercase tracking-widest mb-2 block">Itens para Recolher</label>
                <div className="flex gap-2 mb-3">
                  <input className="flex-1 bg-gray-50 rounded-xl px-4 text-xs outline-none border border-gray-100" placeholder="Ex: Topo de bolo" value={novoItem} onChange={e=>setNovoItem(e.target.value)} />
                  <button onClick={() => { if(novoItem.trim()){ setItens([...itens, novoItem.trim()]); setNovoItem(''); } }} className="bg-[#ded0b8] p-3 rounded-xl text-white shadow-sm active:scale-90 transition-all"><Plus size={18}/></button>
                </div>
                <ul className="space-y-2">
                  {itens.map((it, i) => (
                    <li key={i} className="bg-gray-50 p-3 rounded-2xl flex justify-between items-center italic text-gray-500 text-xs animate-in slide-in-from-left-2">
                      • {it} 
                      <Trash2 size={14} onClick={()=>setItens(itens.filter((_,idx)=>idx!==i))} className="text-red-200 cursor-pointer hover:text-red-400"/>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-b pb-1 pt-4">
                <label className="text-[10px] font-bold text-[#ded0b8] uppercase tracking-widest">Responsável Cerimonial</label>
                <input className="w-full p-1 outline-none text-sm bg-transparent" placeholder="Sua Assinatura" value={form.responsavel} onChange={e=>setForm({...form, responsavel: e.target.value})} />
              </div>

              <button onClick={() => setEtapa('resumo')} className="w-full bg-[#ded0b8] text-white font-bold py-5 rounded-[20px] mt-6 uppercase text-xs tracking-[2px] shadow-lg active:scale-95 transition-all">
                Visualizar Esboço
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ETAPA 2: ABA DE GERENCIAMENTO (RESUMO) --- */}
      {etapa === 'resumo' && (
        <div className="w-full flex flex-col items-center pb-32 animate-in fade-in zoom-in duration-500">
          <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-6 italic">Confira os dados antes de gerar</p>
          
          <div ref={areaCapturaRef} className="w-[380px] bg-[#7e7f7f] p-8 flex flex-col items-center">
            <img src="https://rticfwqptlxkpgawpzwf.supabase.co/storage/v1/object/public/fotos/logo.png" className="max-w-[130px] mb-8" alt="Logo" />
            <div className="w-full bg-white rounded-[30px] p-10 text-gray-700 shadow-sm leading-relaxed">
                <h2 className="text-center font-bold text-xl mb-8 uppercase tracking-[8px] text-[#7e7f7f] border-b pb-4">Relatório</h2>
                <div className="space-y-4 text-xs">
                    <p><strong>EVENTO:</strong> <span className="uppercase">{form.evento}</span></p>
                    <p><strong>LOCAL:</strong> <span className="uppercase">{form.local}</span></p>
                    <div className="pt-4 font-bold border-t">ITENS RECOLHIDOS:</div>
                    <ul className="italic text-gray-400 pl-2 space-y-1">
                      {itens.map((it, i) => <li key={i}>• {it}</li>)}
                    </ul>
                    <p className="border-t pt-6 italic mt-6"><strong>ASSINATURA:</strong> <span className="uppercase">{form.responsavel}</span></p>
                </div>
            </div>
          </div>

          {/* BARRA DE AÇÕES FIXA */}
          <div className="fixed bottom-0 bg-white/90 backdrop-blur-md p-5 flex gap-3 w-full max-w-md rounded-t-[40px] shadow-2xl border-t border-gray-100 z-50">
            <button onClick={() => setEtapa('form')} className="flex-1 bg-gray-100 py-5 rounded-2xl text-[10px] font-bold uppercase text-gray-400 tracking-widest">
              Ajustar Dados
            </button>
            <button onClick={salvarETerminar} disabled={loading} className="flex-2 bg-[#8da38d] text-white py-5 px-10 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                {loading ? <Loader2 className="animate-spin mx-auto"/> : "Confirmar e Enviar"}
            </button>
          </div>
        </div>
      )}

      {/* --- ETAPA 3: SUCESSO --- */}
      {etapa === 'sucesso' && (
        <div className="bg-white rounded-[45px] p-12 text-center shadow-2xl max-w-xs mt-20 animate-in zoom-in duration-500">
          <div className="text-6xl mb-6">✨</div>
          <h2 className="text-gray-500 font-bold uppercase text-sm tracking-[3px] mb-10 leading-tight">Relatório Profissional Gerado!</h2>
          
          <button onClick={enviarWhatsApp} className="w-full bg-[#25D366] text-white py-5 rounded-2xl font-bold text-xs uppercase flex items-center justify-center gap-3 mb-4 shadow-xl active:scale-95 transition-all">
            <Send size={18}/> Enviar no WhatsApp
          </button>
          
          <button onClick={() => window.location.reload()} className="w-full text-gray-300 py-4 text-[9px] font-bold uppercase tracking-[2px] hover:text-[#ded0b8] transition-colors">
            Fazer Novo Relatório
          </button>
        </div>
      )}
    </div>
  );
}
