import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, Calendar, ChevronRight, Loader2, Edit2, Trash2, Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Head from 'next/head';

const supabase = createClient(
  'https://rticfwqptlxkpgawpzwf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0aWNmd3FwdGx4a3BnYXdwendmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDA2MTEsImV4cCI6MjA4OTQxNjYxMX0.vOmi-rKKxXuZ5SP7uZe81Cr0fKW_fWN4Hmuf90soijM'
);

export default function Home() {
  const [reportPublico, setReportPublico] = useState(null);
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [novoEvento, setNovoEvento] = useState({ nome: '', data: '' });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reportId = params.get('id');

    if (reportId) {
      // SE TEM ID NA URL, É O CLIENTE VENDO O RELATÓRIO
      supabase.from('checklists').select('*').eq('id', reportId).single()
        .then(({ data }) => {
          setReportPublico(data);
          setLoading(false);
        });
    } else {
      // SE NÃO TEM ID, É VOCÊ VENDO OS EVENTOS
      carregarEventos();
    }
  }, []);

  async function carregarEventos() {
    setLoading(true);
    const { data } = await supabase.from('eventos').select('*, convidados(rsvp)').order('data', { ascending: true });
    if (data) setEventos(data);
    setLoading(false);
  }

  async function criarOuEditarEvento() {
    if (!novoEvento.nome) return;
    await supabase.from('eventos').insert([novoEvento]);
    setNovoEvento({ nome: '', data: '' });
    setShowModal(false);
    carregarEventos();
  }

  // --- TELA DO CLIENTE (O RELATÓRIO DIGITAL) ---
  if (reportPublico) {
    return (
      <div className="min-h-screen bg-[#7e7f7f] p-6 flex flex-col items-center font-sans">
        <img src="https://rticfwqptlxkpgawpzwf.supabase.co/storage/v1/object/public/fotos/logo.png" className="max-w-[150px] mb-8 mt-10" />
        <div className="w-full max-w-md bg-white rounded-[35px] p-8 shadow-2xl text-gray-700 animate-in zoom-in duration-500">
           <h2 className="text-[#7e7f7f] text-center font-bold text-xl mb-8 uppercase tracking-[5px]">Relatório Digital</h2>
           <div className="space-y-4 text-sm border-t pt-6">
              <p><strong>EVENTO:</strong> {reportPublico.evento}</p>
              <p><strong>LOCAL:</strong> {reportPublico.local}</p>
              <div className="border-t pt-4">
                <strong>ITENS CONFERIDOS:</strong>
                <ul className="mt-2 space-y-1 italic text-gray-500">
                  {reportPublico.itens?.map((it, i) => <li key={i}>• {it}</li>)}
                </ul>
              </div>
              <p className="border-t pt-4 italic"><strong>RESPONSÁVEL:</strong> {reportPublico.responsavel}</p>
              {reportPublico.foto_url && <img src={reportPublico.foto_url} className="mt-6 rounded-2xl w-full border shadow-sm" />}
           </div>
        </div>
        <p className="mt-10 text-white/30 text-[10px] uppercase tracking-widest font-bold text-center leading-relaxed">
          Tudo recolhido com cuidado<br/>pela equipe Cerimonial Elite
        </p>
      </div>
    );
  }

  // --- TELA DO PROFISSIONAL (SUA LISTA DE EVENTOS) ---
  return (
    <div className="min-h-screen bg-[#7e7f7f] p-6 font-sans text-slate-800">
      <div className="max-w-md mx-auto">
        <img src="https://rticfwqptlxkpgawpzwf.supabase.co/storage/v1/object/public/fotos/logo.png" className="max-w-[140px] mx-auto mb-10 mt-6" alt="Logo" />
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-white font-bold uppercase tracking-[3px] text-sm">Meus Eventos</h1>
          <button onClick={() => setShowModal(true)} className="bg-[#ded0b8] p-2 rounded-xl text-white shadow-lg"><Plus size={20}/></button>
        </div>
        {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-white/50" /></div> : (
          <div className="space-y-4">
            {eventos.map(ev => (
              <Link key={ev.id} href={`/menu-evento?id=${ev.id}`} className="block bg-white p-5 rounded-[30px] shadow-xl hover:scale-[1.01] transition-all relative group">
                <div className="pr-10">
                  <h3 className="font-bold text-gray-700 uppercase tracking-tight text-sm leading-tight">{ev.nome}</h3>
                  <p className="text-[9px] text-gray-400 font-bold uppercase mt-2 flex items-center gap-2">
                    <Calendar size={10} /> {ev.data ? new Date(ev.data).toLocaleDateString('pt-BR') : '--/--'}
                    <span className="border-l pl-2 border-gray-100 flex items-center gap-1 text-[#8da38d]"><Users size={10}/> {ev.convidados?.length || 0}</span>
                  </p>
                </div>
                <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 text-[#ded0b8]" size={18} />
              </Link>
            ))}
          </div>
        )}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <div className="bg-white w-full max-w-xs rounded-[35px] p-8 shadow-2xl">
              <h2 className="text-center font-bold text-gray-500 uppercase text-xs mb-6">Novo Evento</h2>
              <input className="w-full border-b p-3 mb-4 outline-none text-sm" placeholder="Nome do Evento" value={novoEvento.nome} onChange={e => setNovoEvento({...novoEvento, nome: e.target.value})} />
              <input type="date" className="w-full border-b p-3 mb-8 outline-none text-sm text-gray-400" value={novoEvento.data} onChange={e => setNovoEvento({...novoEvento, data: e.target.value})} />
              <div className="flex gap-2">
                <button onClick={() => setShowModal(false)} className="flex-1 text-gray-400 font-bold py-3 text-[10px] uppercase">Sair</button>
                <button onClick={criarOuEditarEvento} className="flex-2 bg-[#8da38d] text-white px-6 py-3 rounded-2xl font-bold uppercase text-[10px]">Criar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
