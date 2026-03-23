import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft, Send, Trash2, Loader2, Edit2, FileText } from 'lucide-react';
import Link from 'next/link';

const supabase = createClient(
  'https://rticfwqptlxkpgawpzwf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0aWNmd3FwdGx4a3BnYXdwendmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDA2MTEsImV4cCI6MjA4OTQxNjYxMX0.vOmi-rKKxXuZ5SP7uZe81Cr0fKW_fWN4Hmuf90soijM'
);

export default function Historico() {
  const router = useRouter();
  const { id } = router.query; 
  const [relatorios, setRelatorios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (id) carregarRelatorios(); }, [id]);

  async function carregarRelatorios() {
    setLoading(true);
    const { data } = await supabase.from('checklists').select('*').eq('evento_id', id).order('created_at', { ascending: false });
    if (data) setRelatorios(data);
    setLoading(false);
  }

  const excluir = async (relId) => {
    if (confirm("Apagar este relatório permanentemente?")) {
      await supabase.from('checklists').delete().eq('id', relId);
      carregarRelatorios();
    }
  };

  const reenviarZap = (r) => {
    const linkApp = `${window.location.origin}/?id=${r.id}`;
    const texto = `Olá! Aqui está o seu relatório digital atualizado:\n\n✨ *Seu Relatório Digital:* ${linkApp}\n\nFoi um prazer fazer parte desse sonho.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_top');
  };

  return (
    <div className="min-h-screen bg-[#7e7f7f] p-6 font-sans">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-8 pt-4">
          <Link href={`/menu-evento?id=${id}`} className="bg-white/20 p-2 rounded-full text-white"><ArrowLeft size={20}/></Link>
          <h1 className="text-white font-bold ml-4 uppercase tracking-widest text-sm">Histórico</h1>
        </div>

        {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-white/50" /></div> : (
          <div className="space-y-6 pb-10">
            {relatorios.map(r => (
              <div key={r.id} className="bg-white rounded-[30px] p-6 shadow-xl animate-in fade-in duration-500 border-l-4 border-[#ded0b8]">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-gray-50 p-2 rounded-xl text-[#ded0b8]"><FileText size={20}/></div>
                        <div>
                            <h3 className="font-bold text-gray-700 uppercase text-xs leading-tight">{r.evento || 'Relatório'}</h3>
                            <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase">{new Date(r.created_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                    </div>
                    <button onClick={() => excluir(r.id)} className="text-red-100 hover:text-red-300 p-2 transition-colors"><Trash2 size={16}/></button>
                </div>
                
                <p className="text-[9px] text-gray-400 uppercase font-bold mb-5 italic border-b pb-4">Responsável: {r.responsavel || '-'}</p>

                <div className="flex gap-2">
                    <Link href={`/checklist?id=${id}&reportId=${r.id}`} className="flex-1 bg-gray-50 text-gray-400 text-[10px] font-bold uppercase py-4 rounded-2xl flex items-center justify-center gap-2 border border-gray-100 shadow-inner">
                        <Edit2 size={14}/> Editar Dados
                    </Link>
                    <button onClick={() => reenviarZap(r)} className="flex-1 bg-[#25D366] text-white text-[10px] font-bold uppercase py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                        <Send size={14}/> Reenviar no Zap
                    </button>
                </div>
              </div>
            ))}
            {relatorios.length === 0 && <p className="text-center text-white/40 italic py-10 uppercase text-[10px] tracking-widest font-bold font-sans">Nenhum relatório encontrado.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
