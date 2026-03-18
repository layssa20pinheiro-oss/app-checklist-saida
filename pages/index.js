import { useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Camera, Plus, Trash2, Send, FileDown, Edit3 } from 'lucide-react';

const supabase = createClient(
  'https://rticfwqptlxkpgawpzwf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0aWNmd3FwdGx4a3BnYXdwendmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDA2MTEsImV4cCI6MjA4OTQxNjYxMX0.vOmi-rKKxXuZ5SP7uZe81Cr0fKW_fWN4Hmuf90soijM'
);

export default function ChecklistApp() {
  const [etapa, setEtapa] = useState('form'); 
  const [loading, setLoading] = useState(false);
  const [itens, setItens] = useState([]);
  const [novoItem, setNovoItem] = useState('');
  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [pdfUrl, setPdfUrl] = useState('');
  
  const [form, setForm] = useState({
    evento: '', local: '', presentes: '', convidados: '', obs: '', responsavel: ''
  });

  const pdfRef = useRef();

  const handleAddItem = () => {
    if (novoItem.trim()) {
      setItens([...itens, novoItem.trim()]);
      setNovoItem('');
    }
  };

  const handleRemoveItem = (index) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFoto(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  const gerarPDF = async () => {
    const element = pdfRef.current;
    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    return pdf.output('blob');
  };

  const salvarTudo = async () => {
    setLoading(true);
    try {
      let fotoUrl = '';
      
      if (foto) {
        const fileExt = foto.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { data, error } = await supabase.storage.from('fotos').upload(fileName, foto);
        if (error) throw error;
        fotoUrl = supabase.storage.from('fotos').getPublicUrl(fileName).data.publicUrl;
      }

      const pdfBlob = await gerarPDF();
      const pdfName = `relatorio_${Date.now()}.pdf`;
      const { data: pdfData, error: pdfError } = await supabase.storage.from('fotos').upload(pdfName, pdfBlob);
      if (pdfError) throw pdfError;
      const finalPdfUrl = supabase.storage.from('fotos').getPublicUrl(pdfName).data.publicUrl;
      setPdfUrl(finalPdfUrl);

      const { error: dbError } = await supabase.from('checklists').insert([{
        evento: form.evento,
        local: form.local,
        presentes: parseInt(form.presentes) || 0,
        convidados: parseInt(form.convidados) || 0,
        itens: itens,
        obs: form.obs,
        responsavel: form.responsavel,
        foto_url: fotoUrl,
        pdf_url: finalPdfUrl
      }]);
      
      if (dbError) throw dbError;

      setEtapa('sucesso');
    } catch (err) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const enviarZap = () => {
    const texto = `*Checklist Final - Cerimonial*\n\n` +
      `*Evento:* ${form.evento}\n*Local:* ${form.local}\n` +
      `*Presentes:* ${form.presentes}\n\n` +
      `*Itens:* \n${itens.map(i => '📦 ' + i).join('\n')}\n\n` +
      `*Relatório PDF Oficial:* ${pdfUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_top');
  };

  return (
    <div className="min-h-screen bg-[#7e7f7f] p-4 flex flex-col items-center">
      
      {/* SÓ MOSTRA LOGO NO FORMULÁRIO (EVITA DUPLICIDADE) */}
      {etapa === 'form' && (
        <>
          <div className="mb-6 text-center">
             <img src="https://rticfwqptlxkpgawpzwf.supabase.co/storage/v1/object/public/fotos/logo.png" alt="Logo" className="max-w-[150px] mx-auto" />
          </div>

          <div className="w-full max-w-md bg-white rounded-[30px] p-8 shadow-2xl">
            <h2 className="text-[#7e7f7f] text-center text-xl font-bold mb-6">Checklist de Saída</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#7e7f7f] uppercase">Evento</label>
                <input className="w-full border-b border-gray-200 py-2 outline-none" placeholder="Ex: Maria e João" onChange={e => setForm({...form, evento: e.target.value})} value={form.evento} />
              </div>
              <div>
                <label className="text-xs font-bold text-[#7e7f7f] uppercase">Local</label>
                <input className="w-full border-b border-gray-200 py-2 outline-none" placeholder="Espaço Colonial" onChange={e => setForm({...form, local: e.target.value})} value={form.local} />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs font-bold text-[#7e7f7f] uppercase">Presentes</label>
                  <input type="number" className="w-full border-b border-gray-200 py-2 outline-none" onChange={e => setForm({...form, presentes: e.target.value})} value={form.presentes} />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-[#7e7f7f] uppercase">Convidados</label>
                  <input type="number" className="w-full border-b border-gray-200 py-2 outline-none" onChange={e => setForm({...form, convidados: e.target.value})} value={form.convidados} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-[#7e7f7f] uppercase">Itens Guardados</label>
                <div className="flex gap-2 mt-2">
                  <input className="flex-1 bg-gray-50 rounded-lg px-4 py-2" placeholder="Item..." value={novoItem} onChange={e => setNovoItem(e.target.value)} />
                  <button onClick={handleAddItem} className="bg-[#ded0b8] text-[#7e7f7f] p-2 rounded-lg"><Plus /></button>
                </div>
                <ul className="mt-3 space-y-2">
                  {itens.map((item, i) => (
                    <li key={i} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg text-sm">
                      {item} <button onClick={() => handleRemoveItem(i)}><Trash2 size={16} className="text-red-400"/></button>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <label className="text-xs font-bold text-[#7e7f7f] uppercase">Observações</label>
                <textarea className="w-full border border-gray-200 rounded-lg p-2 mt-1 outline-none" rows="2" onChange={e => setForm({...form, obs: e.target.value})} value={form.obs}></textarea>
              </div>
              <div>
                <label className="text-xs font-bold text-[#7e7f7f] uppercase">Responsável</label>
                <input className="w-full border-b border-gray-200 py-2 outline-none" placeholder="Seu nome" onChange={e => setForm({...form, responsavel: e.target.value})} value={form.responsavel} />
              </div>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#ded0b8] rounded-2xl p-4 cursor-pointer hover:bg-orange-50 transition">
                <Camera className="text-[#7e7f7f] mb-2" />
                <span className="text-xs text-[#7e7f7f] font-bold">TIRAR FOTO</span>
                <input type="file" accept="image/*" capture="camera" className="hidden" onChange={handleFotoChange} />
                {fotoPreview && <img src={fotoPreview} className="mt-2 h-20 rounded-lg" />}
              </label>
              <button onClick={() => setEtapa('resumo')} className="w-full bg-[#ded0b8] text-[#7e7f7f] font-bold py-4 rounded-2xl mt-4 shadow-lg">GERAR ESBOÇO</button>
            </div>
          </div>
        </>
      )}

      {/* TELA DE RESUMO / PDF */}
      {etapa === 'resumo' && (
        <div className="w-full flex flex-col items-center">
          <div ref={pdfRef} className="w-full max-w-md bg-[#7e7f7f] p-8 min-h-[600px] flex flex-col items-center">
            <img src="https://rticfwqptlxkpgawpzwf.supabase.co/storage/v1/object/public/fotos/logo.png" className="max-w-[150px] mb-8" />
            <div className="w-full bg-white rounded-[30px] p-8 shadow-xl text-[#333]">
              <h2 className="text-[#7e7f7f] text-center font-bold text-xl mb-6">Resumo do Evento</h2>
              <div className="space-y-4 text-sm">
                <p><strong>Evento:</strong> {form.evento}</p>
                <p className="border-t pt-2"><strong>Local:</strong> {form.local}</p>
                <div className="border-t pt-2 flex justify-between">
                   <p><strong>Presentes:</strong> {form.presentes}</p>
                   <p><strong>Convidados:</strong> {form.convidados}</p>
                </div>
                <div className="border-t pt-2">
                  <strong>Itens Guardados:</strong>
                  <ul className="mt-2 list-disc list-inside">
                    {itens.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
                <p className="border-t pt-2"><strong>Obs:</strong> {form.obs}</p>
                <p className="border-t pt-2"><strong>Responsável:</strong> {form.responsavel}</p>
                {fotoPreview && (
                  <div className="mt-4 border-t pt-4 text-center">
                    <p className="text-left font-bold mb-2">Foto dos Pertences:</p>
                    <img src={fotoPreview} className="rounded-xl max-w-full" />
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex gap-4 w-full max-w-md">
            <button onClick={() => setEtapa('form')} className="flex-1 bg-white text-[#7e7f7f] font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2"><Edit3 size={18}/> Editar</button>
            <button onClick={salvarTudo} disabled={loading} className="flex-1 bg-[#8da38d] text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2">
              {loading ? "Salvando..." : "Confirmar"}
            </button>
          </div>
        </div>
      )}

      {etapa === 'sucesso' && (
        <div className="w-full max-w-md bg-white rounded-[30px] p-10 shadow-2xl text-center mt-10">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-[#7e7f7f] text-2xl font-bold mb-6">Salvo com Sucesso!</h2>
          <div className="space-y-4">
            <button onClick={enviarZap} className="w-full bg-[#25D366] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg"><Send size={20}/> ENVIAR NO WHATSAPP</button>
            <button onClick={() => window.open(pdfUrl, '_blank')} className="w-full bg-[#4a90e2] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg"><FileDown size={20}/> VER RELATÓRIO PDF</button>
            <button onClick={() => window.location.reload()} className="w-full bg-gray-100 text-[#7e7f7f] font-bold py-4 rounded-2xl">NOVO CHECKLIST</button>
          </div>
        </div>
      )}
    </div>
  );
}
