import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft, Edit2, Send, Trash2, Loader2, User, Calendar, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const supabase = createClient(
  'https://rticfwqptlxkpgawpzwf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0aWNmd3FwdGx4a3BnYXdwendmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDA2MTEsImV4cCI6MjA4OTQxNjYxMX0.vOmi-rKKxXuZ5SP7uZe81Cr0fKW_fWN4Hmuf90soijM'
);

export default function RelatorioDetalhe() {
  const router = useRouter();
  // Lemos o ID do relatório da URL (ex: ?reportId=123...)
  const { reportId } = router.query;

  const [relatorio, setRelatorio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (reportId) {
      carregarRelatorio();
    }
  }, [reportId]);

  async function carregarRelatorio() {
    setLoading(true);
    // Busca o relatório e o evento vinculado a ele
    const { data, error } = await supabase
      .from('checklists')
      .select('*, eventos(nome)')
      .eq('id', reportId)
      .single();

    if (data) setRelatorio(data);
    setLoading(false);
  }

  if (loading) return (
    <div className="min-h-screen bg-[#7e7f7f] flex items-center justify-center">
      <Loader2 className="animate-spin text-white/50" size={40} />
    </div>
  );

  if (!relatorio) return (
    <div className="min-h-screen bg-[#7e7f7f] p-6 text-center">
      <p className="text-white/50 italic">Relatório não encontrado.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#7e7f7f] p-6 font-sans">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-8 pt-4">
          <Link href={`/historico?id=${relatorio.evento_id}`} className="bg-white/20 p-2 rounded-full text-white">
            <ArrowLeft size={20}/>
          </Link>
          <h1 className="text-white font-bold ml-4 uppercase tracking-widest text-sm">Detalhes do Relatório</h1>
        </div>

        {/* O CARD DETALHADO DO RELATÓRIO */}
        <div className="bg-white rounded-[35px] p-8 shadow-2xl relative animate-in fade-in duration-300">
          
          <div className="flex justify-between items-start mb-6 pr-6">
            <div>
              <h2 className="font-bold text-gray-700 uppercase tracking-tight text-xl leading-tight">
                {relatorio.evento || relatorio.eventos?.nome || 'Relatório sem nome'}
              </h2>
              <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase flex items-center gap-1">
                <Calendar size={12}/> {new Date(relatorio.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          <div className="space-y-4 mb-10 border-t pt-6 border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User size={16} className="text-[#ded0b8]"/>
              <p className="text-[11px] uppercase font-bold tracking-widest">Responsável:</p>
              <p className="text-sm font-bold text-gray-700 uppercase">{relatorio.responsavel || 'Não informado'}</p>
            </div>
            
            <a 
              href={relatorio.pdf_url} 
              target="_blank" 
              rel="noreferrer" 
              className="text-[#8da38d] text-xs font-bold uppercase flex items-center gap-2"
            >
              <ExternalLink size={14}/> Ver Checklist Completo
            </a>
          </div>

          {/* BOTÕES DE AÇÃO: EXATAMENTE COMO NA FOTO "ANTES" */}
          <div className="flex flex-col gap-3">
             <Link href={`/checklist?reportId=${relatorio.id}&id=${relatorio.evento_id}`} className="w-full bg-gray-50 border border-gray-100 text-gray-500 font-bold py-4 rounded-2xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-inner active:scale-95 transition-all">
                <Edit2 size={16}/> Editar Dados
             </Link>
             
             <a 
                href={`https://wa.me/?text=${encodeURIComponent('Oi! Segue o relatório digital do evento: ' + window.location.origin + '/?id=' + relatorio.id)}`}
                className="w-full bg-[#25D366] text-white font-bold py-4 rounded-2xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
             >
                <Send size={16}/> Reenviar no Zap
             </a>
          </div>
        </div>
      </div>
    </div>
  );
}
