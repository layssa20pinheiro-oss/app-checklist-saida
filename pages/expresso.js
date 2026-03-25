import { useState, useRef, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import html2canvas from 'html2canvas';
import { Camera, Plus, Trash2, Send, Loader2, ArrowLeft, FileText, Edit2, Clock, Users, Gift, FileSignature } from 'lucide-react';
import Head from 'next/head';

const supabase = createClient(
  'https://rticfwqptlxkpgawpzwf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0aWNmd3FwdGx4a3BnYXdwendmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDA2MTEsImV4cCI6MjA4OTQxNjYxMX0.vOmi-rKKxXuZ5SP7uZe81Cr0fKW_fWN4Hmuf90soijM'
);

export default function ChecklistExpresso() {
  const [etapa, setEtapa] = useState('lista'); // lista, form, resumo, sucesso
  const [loading, setLoading] = useState(false);
  const [loadingHistorico, setLoadingHistorico] = useState(true);
  const [historicoExpresso, setHistoricoExpresso] = useState([]);
  
  // Estados do Formulário
  const [itens, setItens] = useState([]);
  const [novoItem, setNovoItem] = useState('');
  const [form, setForm] = useState({ evento: '', local: '', responsavel: '', obs: '', presentes: '', convidados_qtd: '' });
  const [finalReportId, setFinalReportId] = useState('');
  const [editingReportId, setEditingReportId] = useState(null); // ID do relatório antigo sendo editado
  const areaCapturaRef = useRef();

  // CARREGA HISTÓRICO EXPRESSO (Sem evento_id)
  useEffect(() => {
    if (etapa === 'lista') {
      carregarHistoricoExpresso();
    }
  }, [etapa]);

  async function carregarHistoricoExpresso() {
    setLoadingHistorico(true);
    // Busca checklists onde evento_id é nulo (gerados pelo /expresso)
    const { data } = await supabase
      .from('checklists')
      .select('*')
      .is('evento_id', null)
      .order('created_at', { ascending: false });
    
    if (data) setHistoricoExpresso(data);
    setLoadingHistorico(false);
  }

  // ABRE FORMULÁRIO PARA NOVO OU EDITAR
  const abrirFormulario = (report = null) => {
    if (report) {
      // EDITAR ANTIGO
      setEditingReportId(report.id);
      setForm({
        evento: report.evento || '',
        local: report.local || '',
        responsavel: report.responsavel || '',
        obs: report.obs || '',
        presentes: report.presentes || '',
        convidados_qtd: report.convidados_qtd || ''
      });
      setItens(report.itens || []);
    } else {
      // NOVO LIMPÃO
      setEditingReportId(null);
      setForm({ evento: '', local: '', responsavel: '', obs: '', presentes: '', convidados_qtd: '' });
      setItens([]);
    }
    setEtapa('form');
  };

  // SALVA E GERA IMAGEM
  const salvarRelatorioExpresso = async () => {
    if (!form.evento || !form.responsavel) return alert("Por favor, preencha o nome do evento e o responsável.");
    setLoading(true);
    try {
      // 1. Gera imagem
      const canvas = await html2canvas(areaCapturaRef.current, { scale: 2, backgroundColor: "#7e7f7f" });
      const imagemBlob = await new Promise(res => canvas.toBlob(res, 'image/png'));
      const nomeImg = `fds_${Date.now()}.png`;
      
      // 2. Sobe imagem
      await supabase.storage.from('fotos').upload(nomeImg, imagemBlob);
      const urlImg = supabase.storage.from('fotos').getPublicUrl(nomeImg).data.publicUrl;

      // 3. Salva dados no Banco
      const dadosParaSalvar = { 
        ...form, 
        itens, 
        pdf_url: urlImg,
        evento_id: null // Garante que é expresso
      };
      
      let res;
      if (editingReportId) {
        // ATUALIZA EXISTENTE
        res = await supabase.from('checklists').update(dadosParaSalvar).eq('id', editingReportId).select();
      } else {
        // INSERE NOVO
        res = await supabase.from('checklists').insert([dadosParaSalvar]).select();
      }

      if (res.data) {
        setFinalReportId(res.data[0].id);
        setEtapa('sucesso');
      }
    } catch (e) { alert("Erro: " + e.message); }
    setLoading(false);
  };

  const reenviarWhatsApp = (report) => {
    const linkApp = `${window.location.origin}/?id=${report.id}`;
    const texto = `Olá! Finalizamos a organização e conferência dos seus pertences. Aqui está o resumo digital de tudo o que guardamos:\n\n✨ *Seu Relatório Digital:* ${linkApp}\n\nFoi um prazer fazer parte desse sonho.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_top');
  };

  return (
    <div className="min-h-screen bg-[#7e7f7f] p-4 flex flex-col items-center font-sans text-slate-800">
      <Head><title>Cerimonial Elite | Checklist Expresso</title><link rel="icon" href="/icon.png" /></Head>
      <img src="https://rticfwqptlxkpgawpzwf.supabase.co/storage/v1/object/public/fotos/logo.png" className="max-w-[130px] mb-8 mt-6" alt="Logo" />

      {/* --- ETAPA: LISTA DE RELATÓRIOS EXPRESSOS (GERENCIAMENTO) --- */}
      {etapa === 'lista' && (
        <div className="w-full max-w-md animate-in fade-in duration-500">
          <div className="flex justify-between items-center mb-6 text-white font-bold uppercase tracking-[2px] text-xs">
            <h1>Relatórios de Emergência FDS</h1>
            <button onClick={() => abrirFormulario()} className="bg-[#ded0b8] p-3 rounded-full shadow-lg active:scale-90 transition-all">
                <Plus size={20}/>
            </button>
          </div>

          {loadingHistorico ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-white/50" size={30} /></div>
          ) : (
            <div className="space-y-6 pb-20">
              {historicoExpresso.map(r => (
                <div key={r.id} className="bg-white rounded-[30px] p-6 shadow-xl border-l-4 border-[#ded0b8]">
                  <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                          <div className="bg-gray-50 p-2 rounded-xl text-[#ded0b8]"><FileSignature size={20}/></div>
                          <div>
                              <h3 className="font-bold text-gray-700 uppercase text-xs leading-tight pr-5">{r.evento || 'Relatório'}</h3>
                              <p className="text-[9px] text-gray-400 font-bold uppercase mt-1 flex items-center gap-1"><Clock size={10}/>{new Date(r.created_at).toLocaleDateString('pt-BR')}</p>
                          </div>
                      </div>
                      <button onClick={async () => { if(confirm("Apagar permanentemente?")){ await supabase.from('checklists').delete().eq('id', r.id); carregarHistoricoExpresso(); } }} className="text-red-100 p-2"><Trash2 size={16}/></button>
                  </div>
                  
                  <div className="flex gap-2">
                      <button onClick={() => abrirFormulario(r)} className="flex-1 bg-gray-50 text-gray-400 text-[10px] font-bold uppercase py-4 rounded-2xl flex items-center justify-center gap-2 border border-gray-100 shadow-inner active:scale-95 transition-all">
                          <Edit2 size={14}/> Editar Dados (Lápis)
                      </button>
                      <button onClick={() => reenviarWhatsApp(r)} className="flex-1 bg-[#25D366] text-white text-[10px] font-bold uppercase py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                          <Send size={14}/> Reenviar no Zap
                      </button>
                  </div>
                </div>
              ))}
              {historicoExpresso.length === 0 && <p className="text-center text-white/40 italic py-10 uppercase text-[10px] tracking-widest font-bold">Nenhum relatório genérico salvo.</p>}
            </div>
          )}
        </div>
      )}

      {/* --- ETAPA 1: FORMULÁRIO (CONSTRUÇÃO COM TODOS OS CAMPOS) --- */}
      {etapa === 'form' && (
        <div className="w-full max-w-md animate-in fade-in duration-500 pb-20">
          <button onClick={() => setEtapa('lista')} className="text-white/50 mb-4 flex items-center gap-2 text-xs uppercase font-bold tracking-widest"><ArrowLeft size={16}/> Voltar para Gerenciamento</button>
          
          <div className="bg-white rounded-[35px] p-8 shadow-2xl">
            <h2 className="text-center font-bold text-gray-400 mb-8 uppercase text-xs tracking-[3px] border-b pb-4">{editingReportId ? "Editar Dados FDS" : "Novo Checklist FDS"}</h2>
            
            <div className="space-y-5 text-gray-600">
              <div className="border-b pb-1">
                <label className="text-[10px] font-bold text-[#ded0b8] uppercase tracking-widest">Evento</label>
                <input className="w-full p-1 outline-none text-sm bg-transparent" placeholder="Nome dos Noivos/Debutante" value={form.evento} onChange={e=>setForm({...form, evento: e.target.value})} />
              </div>

              <div className="border-b pb-1">
                <label className="text-[10px] font-bold text-[#ded0b8] uppercase tracking-widest">Local</label>
                <input className="w-full p-1 outline-none text-sm bg-transparent" placeholder="Salão / Buffet" value={form.local} onChange={e=>setForm({...form, local: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="border-b pb-1">
                    <label className="text-[10px] font-bold text-[#ded0b8] uppercase tracking-widest flex items-center gap-1"><Gift size={11}/> Presentes Recebidos</label>
                    <input className="w-full p-1 outline-none text-sm bg-transparent" placeholder="Sim/Não - Detalhes" value={form.presentes} onChange={e=>setForm({...form, presentes: e.target.value})} />
                  </div>
                  <div className="border-b pb-1">
                    <label className="text-[10px] font-bold text-[#ded0b8] uppercase tracking-widest flex items-center gap-1"><Users size={11}/> Qtd. Convidados</label>
                    <input type="number" className="w-full p-1 outline-none text-sm bg-transparent" placeholder="Total" value={form.convidados_qtd} onChange={e=>setForm({...form, convidados_qtd: e.target.value})} />
                  </div>
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

              <div className="pt-2">
                <label className="text-[10px] font-bold text-[#ded0b8] uppercase tracking-widest block mb-1">Observações</label>
                <textarea className="w-full border rounded-xl p-3 text-xs outline-none bg-gray-50/50" placeholder="Anotações extras..." value={form.obs} onChange={e=>setForm({...form, obs: e.target.value})} rows={3}></textarea>
              </div>

              <div className="border-b pb-1 pt-2">
                <label className="text-[10px] font-bold text-[#ded0b8] uppercase tracking-widest">Sua Assinatura</label>
                <input className="w-full p-1 outline-none text-sm bg-transparent" placeholder="Responsável Cerimonial" value={form.responsavel} onChange={e=>setForm({...form, responsavel: e.target.value})} />
              </div>

              <button onClick={() => setEtapa('resumo')} className="w-full bg-[#ded0b8] text-white font-bold py-5 rounded-[20px] mt-6 uppercase text-xs tracking-[2px] shadow-lg active:scale-95 transition-all">
                Visualizar e Gerenciar
              </button>
            </div>
          </div>
        </div>
      )}

      {etapa === 'resumo' && (
        <div className="w-full flex flex-col items-center pb-32 animate-in fade-in zoom-in duration-500">
          <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-6 italic">Aba de Gerenciamento: Confira os dados</p>
          
          <div ref={areaCapturaRef} className="w-[380px] bg-[#7e7f7f] p-8 flex flex-col items-center">
            <img src="https://rticfwqptlxkpgawpzwf.supabase.co/storage/v1/object/public/fotos/logo.png" className="max-w-[130px] mb-8" alt="Logo" />
            <div className="w-full bg-white rounded-[30px] p-10 text-gray-700 shadow-sm leading-relaxed">
                <h2 className="text-center font-bold text-xl mb-8 uppercase tracking-[8px] text-[#7e7f7f] border-b pb-4">Relatório</h2>
                <div className="space-y-4 text-xs">
                    <p><strong>EVENTO:</strong> <span className="uppercase">{form.evento}</span></p>
                    <p><strong>LOCAL:</strong> <span className="uppercase">{form.local}</span></p>
                    <p><strong>PRESENTES:</strong> <span className="italic">{form.presentes || 'Nenhum informado'}</span></p>
                    <p><strong>QTD. CONVIDADOS:</strong> <span className="italic">{form.convidados_qtd || '-'}</span></p>
                    
                    <div className="pt-4 font-bold border-t">ITENS RECOLHIDOS:</div>
                    <ul className="italic text-gray-400 pl-2 space-y-1 border-b pb-4">
                      {itens.map((it, i) => <li key={i}>• {it}</li>)}
                    </ul>

                    <p><strong>OBSERVAÇÕES:</strong> <span className="italic text-gray-500">{form.obs || 'Nenhuma.'}</span></p>
                    <p className="border-t pt-6 italic mt-6"><strong>ASSINATURA:</strong> <span className="uppercase">{form.responsavel}</span></p>
                </div>
            </div>
          </div>

          <div className="fixed bottom-0 bg-white/90 backdrop-blur-md p-5 flex gap-3 w-full max-w-md rounded-t-[40px] shadow-2xl border-t border-gray-100 z-50">
            <button onClick={() => setEtapa('form')} className="flex-1 bg-gray-50 py-5 rounded-2xl text-[10px] font-bold uppercase text-gray-400 tracking-widest">
              Ajustar Dados
            </button>
            <button onClick={salvarRelatorioExpresso} disabled={loading} className="flex-2 bg-[#8da38d] text-white py-5 px-10 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                {loading ? <Loader2 className="animate-spin mx-auto"/> : "Confirmar e Enviar"}
            </button>
          </div>
        </div>
      )}

      {etapa === 'sucesso' && (
        <div className="bg-white rounded-[45px] p-12 text-center shadow-2xl max-w-xs mt-20 animate-in zoom-in duration-500">
          <div className="text-6xl mb-6">✨</div>
          <h2 className="text-gray-500 font-bold uppercase text-sm tracking-[3px] mb-10 leading-tight">Relatório Profissional Gerado!</h2>
          <button onClick={() => { enviarWhatsApp(); window.location.reload(); }} className="w-full bg-[#25D366] text-white py-5 rounded-2xl font-bold text-xs uppercase flex items-center justify-center gap-3 mb-4 shadow-xl active:scale-95 transition-all">
            <Send size={18}/> Enviar no WhatsApp
          </button>
          <button onClick={() => setEtapa('lista')} className="w-full text-gray-300 py-4 text-[9px] font-bold uppercase tracking-[2px] hover:text-[#ded0b8] transition-colors">Voltar para Gerenciamento</button>
        </div>
      )}
    </div>
  );
}
