import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, Calendar, User, ExternalLink, Send, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

const supabase = createClient(
  'https://rticfwqptlxkpgawpzwf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0aWNmd3FwdGx4a3BnYXdwendmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDA2MTEsImV4cCI6MjA4OTQxNjYxMX0.vOmi-rKKxXuZ5SP7uZe81Cr0fKW_fWN4Hmuf90soijM'
);

export default function Historico() {
  const [relatorios, setRelatorios] = useState([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);
    const { data, error } = await supabase
      .from('checklists')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setRelatorios(data);
    setLoading(false);
  }

  const filtrarRelatorios = relatorios.filter(r => 
    r.evento?.toLowerCase().includes(busca.toLowerCase()) || 
    r.responsavel?.toLowerCase().includes(busca.toLowerCase())
  );

  const enviarZap = (r) => {
    const linkDigital = `${window.location.origin}/?id=${r.id}`;
    const texto = `Olá! Segue novamente o link do seu Relatório Digital de conferência:\n\n✨ *Relatório:* ${linkDigital}\n\nFoi um prazer atender você!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#7e7f7f] p-4 font-sans text-slate-800">
      <div className="max-w-2xl mx-auto">
        
        {/* HEADER COM BOTÃO VOLTAR */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="bg-white/20 p-2 rounded-full text-white hover:bg-white/30 transition">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-white font-bold text-xl tracking-widest uppercase text-center flex-1">Histórico</h1>
          <div className="w-10"></div> {/* Equilíbrio visual */}
        </div>

        {/* BARRA DE BUSCA */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar evento ou responsável..." 
            className="w-full bg-white rounded-2xl py-3 pl-12 pr-4 shadow-lg outline-none text-sm"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        {/* LISTA DE RELATÓRIOS */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-white opacity-50">
            <Loader2 className="animate-spin mb-2" />
            <p className="italic">Consultando arquivos...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtrarRelatorios.map((rel) => (
              <div key={rel.id} className="bg-white rounded-[25px] p-6 shadow-xl border-l-8 border-[#ded0b8]">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-[#7e7f7f] text-lg uppercase leading-tight mb-1">{rel.evento}</h3>
                    <div className="flex items-center gap-2 text-gray-400 text-xs">
                      <Calendar size={12} />
                      {new Date(rel.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <span className="bg-[#f0ece3] text-[#7e7f7f] text-[10px] font-bold px-3 py-1 rounded-full uppercase">Finalizado</span>
                </div>

                <div className="flex items-center gap-2 text-gray-500 text-sm mb-6 border-t pt-4">
                  <User size={14} />
                  <span className="font-medium">Responsável: {rel.responsavel}</span>
                </div>

                <div className="flex gap-2">
                  <a 
                    href={`/?id=${rel.id}`} 
                    target="_blank" 
                    className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-gray-200"
                  >
                    <ExternalLink size={14} /> VER DIGITAL
                  </a>
                  <button 
                    onClick={() => enviarZap(rel)}
                    className="flex-1 bg-[#25D366] text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm active:scale-95"
                  >
                    <Send size={14} /> REENVIAR
                  </button>
                </div>
              </div>
            ))}

            {filtrarRelatorios.length === 0 && (
              <p className="text-center text-white/50 py-10 italic">Nenhum evento encontrado.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
