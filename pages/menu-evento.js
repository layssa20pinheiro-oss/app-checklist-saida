import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ClipboardList, Users, History, ArrowLeft, Calendar } from 'lucide-react';
import Link from 'next/link';

const supabase = createClient(
  'https://rticfwqptlxkpgawpzwf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0aWNmd3FwdGx4a3BnYXdwendmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDA2MTEsImV4cCI6MjA4OTQxNjYxMX0.vOmi-rKKxXuZ5SP7uZe81Cr0fKW_fWN4Hmuf90soijM'
);

export default function MenuEvento() {
  const router = useRouter();
  const { id } = router.query;
  const [evento, setEvento] = useState(null);

  useEffect(() => {
    if (id) {
      supabase.from('eventos').select('*').eq('id', id).single().then(({ data }) => setEvento(data));
    }
  }, [id]);

  if (!evento) return null;

  return (
    <div className="min-h-screen bg-[#7e7f7f] p-6 flex flex-col items-center font-sans">
      <div className="w-full max-w-md">
        <Link href="/" className="bg-white/10 p-2 rounded-full text-white inline-block mb-6"><ArrowLeft size={20}/></Link>
        <div className="text-center text-white mb-10">
          <h1 className="font-bold uppercase tracking-[4px] text-lg">{evento.nome}</h1>
          <p className="text-[10px] opacity-60 uppercase font-bold mt-1 tracking-widest flex items-center justify-center gap-2">
            <Calendar size={12}/> {new Date(evento.data).toLocaleDateString('pt-BR')}
          </p>
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-[35px] p-2 shadow-xl">
             <Link href={`/checklist?id=${id}`} className="w-full p-6 flex items-center gap-4 text-left">
                <div className="bg-[#ded0b8] p-4 rounded-2xl text-white shadow-inner"><ClipboardList /></div>
                <div>
                  <h3 className="font-bold text-gray-700 uppercase tracking-widest text-sm">Novo Relatório</h3>
                  <p className="text-[10px] text-gray-400 uppercase tracking-tighter italic">Checklist de Saída</p>
                </div>
             </Link>
             <Link href={`/historico?id=${id}`} className="flex items-center justify-center gap-2 py-4 border-t border-gray-50 text-[#ded0b8]">
                <History size={16} />
                <span className="text-[10px] font-bold uppercase tracking-[2px]">Acessar Histórico</span>
             </Link>
          </div>
          <Link href={`/lista?id=${id}`} className="bg-white p-6 rounded-[35px] shadow-xl flex items-center gap-4 text-left group">
            <div className="bg-[#ded0b8] p-4 rounded-2xl text-white shadow-inner"><Users /></div>
            <div>
              <h3 className="font-bold text-gray-700 uppercase tracking-widest text-sm">Gestão de Convidados</h3>
              <p className="text-[10px] text-gray-400 uppercase tracking-tighter italic">Lista, RSVP e Portaria</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
