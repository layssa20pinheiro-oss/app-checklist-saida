import { useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import html2canvas from 'html2canvas';
import jsPDF from 'jsPDF';
import { Camera, Plus, Trash2, Send, FileDown, Edit3, Loader2 } from 'lucide-react';

const supabase = createClient(
  'https://rticfwqptlxkpgawpzwf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0aWNmd3FwdGx4a3BnYXdwendmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDA2MTEsImV4cCI6MjA4OTQxNjYxMX0.vOmi-rKKxXuZ5SP7uZe81Cr0fKW_fWN4Hmuf90soijM'
);

export default function ChecklistApp() {
  const [etapa, setEtapa] = useState('form'); 
  const [loading, setLoading] = useState(false);
  const [itens, setItens] = useState([]);
  const [novoItem, setNovoItem] = useState('');
  const [fotoBlob, setFotoBlob] = useState(null);
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

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Otimização: Reduzir a imagem antes de processar
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; // Tamanho ideal para web/PDF
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            setFotoBlob(blob);
            setFotoPreview(URL.createObjectURL(blob));
          }, 'image/jpeg', 0.7);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const gerarPDF = async () => {
    const element = pdfRef.current;
    // Forçar largura de folha A4 para o print não sair cortado
    const canvas = await html2canvas(element, { 
      scale: 2, 
      useCORS: true, 
      logging: false,
      windowWidth: 600 // Mantém proporção de documento
    });
    const imgData = canvas.toDataURL('image/jpeg', 0.8);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    return pdf.output('blob');
  };

  const salvarTudo = async () => {
    if (loading) return;
    setLoading(true);
    try {
      let fotoPath = '';
      
      // 1. Upload da Foto Otimizada
      if (fotoBlob) {
        const fileName = `foto_${Date.now()}.jpg`;
        const { data, error } = await supabase.storage.from('fotos').upload(fileName, fotoBlob);
        if (error) throw error;
        fotoPath = supabase.storage.from('fotos').getPublicUrl(fileName).data.publicUrl;
      }

      // 2. Gerar e Upload do PDF
      const pdfBlob = await gerarPDF();
      const pdfName = `relatorio_${Date.now()}.pdf`;
      const { data: pdfData, error: pdfError } = await supabase.storage.from('fotos').upload(pdfName, pdfBlob);
      if (pdfError) throw pdfError;
      const finalPdfUrl = supabase.storage.from('fotos').getPublicUrl(pdfName).data.publicUrl;
      setPdfUrl(finalPdfUrl);

      // 3. Salvar Banco de Dados
      const { error: dbError } = await supabase.from('checklists').insert([{
        evento: form.evento,
        local: form.local,
        presentes: parseInt(form.presentes) || 0,
        convidados: parseInt(form.convidados) || 0,
        itens: itens,
        obs: form.obs,
        responsavel: form.responsavel,
        foto_url: fotoPath,
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

  return (
    <div className="min-h-screen bg-[#7e7f7f] p-4 flex flex-col items-center font-sans">
      
      {etapa === 'form' && (
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
             <img src="https://rticfwqptlxkpgawpzwf.supabase.co/storage/v1/object/public/fotos/logo.png" alt="Logo" className="max-w-[150px] mx-auto" />
          </div>
          <div className="bg-white rounded-[30px] p-8 shadow-2xl">
            <h2 className="text-[#7e7f7f] text-center text-xl font-bold mb-6">Checklist de Saída</h2>
            <div className="space-y-4">
              <input className="w-full border-b border-gray-200 py-2 outline-none" placeholder="Evento" onChange={e => setForm({...form, evento: e.target.value})} value={form.evento} />
              <input className="w-full border-b border-gray-200 py-2 outline-none" placeholder="Local" onChange={e => setForm({...form, local: e.target.value})} value={form.local} />
              <div className="flex gap-4">
                <input type="number" className="w-full border-b border-gray-200 py-2 outline-none" placeholder="Presentes" onChange={e => setForm({...form, presentes: e.target.value})} value={form.presentes} />
                <input type="number" className="w-full border-b border-gray-200 py-2 outline-none" placeholder="Convidados" onChange={e => setForm({...form, convidados: e.target.value})} value={form.convidados} />
              </div>
              <div>
                <div className="flex gap-2 mt-2">
                  <input className="flex-1 bg-gray-50 rounded-lg px-4 py-2" placeholder="Adicionar item..." value={novoItem} onChange={e => setNovoItem(e.target.value)} />
                  <button onClick={handleAddItem} className="bg-[#ded0b8] text-[#7e7f7f] p-2 rounded-lg"><Plus /></button>
                </div>
                <ul className="mt-3 space-y-1">
                  {itens.map((item, i) => (
                    <li key={i} className="flex justify-between bg-gray-50 p-2 rounded-lg text-sm">
                      {item} <button onClick={() => setItens(itens.filter((_, idx) => idx !== i))}><Trash2 size={14} className="text-red-400"/></button>
                    </li>
                  ))}
                </ul>
              </div>
              <textarea className="w-full border border-gray-100 rounded-lg p-2 outline-none text-sm" placeholder="Observações..." rows="2" onChange={e => setForm({...form, obs: e.target.value})} value={form.obs}></textarea>
              <input className="w-full border-b border-gray-200 py-2 outline-none" placeholder="Responsável" onChange={e => setForm({...form, responsavel: e.target.value})} value={form.responsavel} />
              
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#ded0b8] rounded-2xl p-4 cursor-pointer">
                <Camera className="text-[#7e7f7f] mb-1" />
                <span className="text-xs font-bold text-[#7e7f7f]">FOTO DOS PERTENCES</span>
                <input type="file" accept="image/*" capture="camera" className="hidden" onChange={handleFotoChange} />
                {fotoPreview && <img src={fotoPreview} className="mt-2 h-24 rounded-lg shadow-md" />}
              </label>

              <button onClick={() => setEtapa('resumo')} className="w-full bg-[#ded0b8] text-[#7e7f7f] font-bold py-4 rounded-2xl mt-4 shadow-lg">GERAR ESBOÇO</button>
            </div>
          </div>
        </div>
      )}

      {etapa === 'resumo' && (
        <div className="w-full flex flex-col items-center">
          {/* CONTAINER DO PDF - ESTILO FOLHA */}
          <div ref={pdfRef} className="w-[450px] bg-[#7e7f7f] p-6 flex flex-col items-center overflow-hidden">
            <img src="https://rticfwqptlxkpgawpzwf.supabase.co/storage/v1/object/public/fotos/logo.png" className="max-w-[140px] mb-6" />
            <div className="w-full bg-white rounded-[25px] p-8 shadow-xl text-[#333]">
              <h2 className="text-[#7e7f7f] text-center font-bold text-lg mb-6 uppercase tracking-widest">Resumo do Evento</h2>
              <div className="space-y-3 text-sm">
                <p className="border-b pb-2"><strong>Evento:</strong> {form.evento}</p>
                <p className="border-b pb-2"><strong>Local:</strong> {form.local}</p>
                <div className="border-b pb-2 flex justify-between">
                   <p><strong>Presentes:</strong> {form.presentes}</p>
                   <p><strong>Convidados:</strong> {form.convidados}</p>
                </div>
                <div className="border-b pb-2">
                  <strong>Itens Guardados:</strong>
                  <ul className="mt-1 space-y-1">
                    {itens.map((item, i) => <li key={i}>• {item}</li>)}
                  </ul>
                </div>
                <p className="border-b pb-2"><strong>Obs:</strong> {form.obs}</p>
                <p className="border-b pb-2"><strong>Responsável:</strong> {form.responsavel}</p>
                {fotoPreview && (
                  <div className="mt-4 pt-2">
                    <p className="font-bold mb-2">Foto em anexo:</p>
                    <img src={fotoPreview} className="rounded-xl w-full shadow-sm" />
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex gap-4 w-full max-w-md pb-10">
            <button onClick={() => setEtapa('form')} className="flex-1 bg-white text-[#7e7f7f] font-bold py-4 rounded-2xl shadow-md flex items-center justify-center gap-2"><Edit3 size={18}/> Editar</button>
            <button onClick={salvarTudo} disabled={loading} className="flex-1 bg-[#8da38d] text-white font-bold py-4 rounded-2xl shadow-md flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin" /> : "Confirmar"}
            </button>
          </div>
        </div>
      )}

      {etapa === 'sucesso' && (
        <div className="w-full max-w-md bg-white rounded-[30px] p-10 shadow-2xl text-center mt-10">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-[#7e7f7f] text-2xl font-bold mb-6">Relatório Gerado!</h2>
          <div className="space-y-4">
            <button onClick={enviarZap} className="w-full bg-[#25D366] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2"><Send size={20}/> WHATSAPP</button>
            <a href={pdfUrl} target="_blank" className="w-full bg-[#4a90e2] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-center inline-block"><FileDown size={20}/> ABRIR PDF</a>
            <button onClick={() => window.location.reload()} className="w-full bg-gray-100 text-[#7e7f7f] font-bold py-4 rounded-2xl">VOLTAR</button>
          </div>
        </div>
      )}
    </div>
  );
}
