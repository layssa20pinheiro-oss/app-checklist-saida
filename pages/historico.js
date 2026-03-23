import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft, FileText, Send, Trash2, Loader2, Calendar } from 'lucide-react';
import Link from 'next/link';

const supabase = createClient(
  'https://rticfwqptlxkpgawpzwf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0aWNmd3FwdGx4a3BnYXdwendmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDA2MTEsImV4cCI6MjA4OTQxNjYxMX0.vOmi-rKKxXuZ5SP7uZe81Cr0fKW_fWN4Hmuf90soijM'
);

export default function Historico() {
  const router = useRouter();
  const { id } = router.query; // Pega o ID do evento da URL
  const [relatorios, setRelatorios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) { carregarRelatorios(); }
  }, [id]);

  async function carregarRelatorios() {
    setLoading(true);
    // FILTRO IMPORTANTE: .eq('evento_id', id) garante que só mostre deste evento
    const { data } = await supabase
      .from('checklists')
      .select('*')
      .eq('evento_id', id)
      .order('created_at', { ascending: false });
    
    if (data) setRelatorios(data);
    setLoading(false);
  }

  const excluir = async (relId) => {
    if (confirm("Deseja apagar este relatório permanentemente?")) {
      await supabase.from('checklists').delete().eq('id', relId);
      carregarRelatorios();
    }
  };

  return (
    <div className="min-h-screen bg-[#7e7f7f] p-6 font-sans">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-8 pt-4">
          <Link href={`/menu-evento?id=${id}`} className="bg-white/20 p-2 rounded-full text-white"><ArrowLeft size={20}/></Link>
          <h1 className="text-white font-bold ml-4 uppercase tracking-widest text-sm">Histórico</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-white/50" /></div>
        ) : (
          <div className="space-y-4">
            {relatorios.map(r => (
              <div key={r.id} className="bg-white p-5 rounded-[25px] shadow-lg flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="bg-gray-100 p-3 rounded-2xl text-[#ded0b8]"><FileText size={20}/></div>
                   <div>
                      <p className="font-bold text-gray-600 text-xs uppercase leading-tight">{r.evento}</p>
                      <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase flex items-center gap-1">
                        <Calendar size={10}/> {new Date(r.created_at).toLocaleDateString('pt-BR')}
                      </p>
                   </div>
                </div>
                <div className="flex gap-2">
                   <a href={r.pdf_url} target="_blank" rel="noreferrer" className="p-2 text-green-400"><Send size={18}/></a>
                   <button onClick={() => excluir(r.id)} className="p-2 text-red-200"><Trash2 size={18}/></button>
                </div>
              </div>
            ))}
            {relatorios.length === 0 && <p className="text-center text-white/40 italic py-10">Nenhum relatório neste evento.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
