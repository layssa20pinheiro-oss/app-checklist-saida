import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Plus, Send, User, Trash2, ArrowLeft, Loader2, CheckCircle, XCircle, Clock, Phone, QrCode, UserCheck, UserX } from 'lucide-react';
import Link from 'next/link';

const supabase = createClient(
  'https://rticfwqptlxkpgawpzwf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0aWNmd3FwdGx4a3BnYXdwendmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDA2MTEsImV4cCI6MjA4OTQxNjYxMX0.vOmi-rKKxXuZ5SP7uZe81Cr0fKW_fWN4Hmuf90soijM'
);

export default function ListaConvidados() {
  const router = useRouter();
  const { eventoId } = router.query; // Pega o ID do evento da URL

  const [lista, setLista] = useState([]);
  const [nome, setNome] = useState('');
  const [mesa, setMesa] = useState('');
  const [telefone, setTelefone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => { 
    if (eventoId) carregarLista(); 
  }, [eventoId]);

  async function carregarLista() {
    // FILTRO: Só busca convidados onde o evento_id é igual ao ID desta página
    const { data } = await supabase
        .from('convidados')
        .select('*')
        .eq('evento_id', eventoId)
        .order('nome');
    if (data) setLista(data);
  }

  const addConvidado = async () => {
    if (!nome || !eventoId) return;
    setLoading(true);
    const telLimpo = telefone.replace(/\D/g, '');
    
    // SALVA: Inclui o evento_id para "etiquetar" o convidado
    const { error } = await supabase.from('convidados').insert([{ 
        nome, 
        mesa, 
        telefone: telLimpo, 
        rsvp: 'pendente',
        evento_id: eventoId 
    }]);

    if (error) { alert("Erro: " + error.message); }
    else { setNome(''); setMesa(''); setTelefone(''); carregarLista(); }
    setLoading(false);
  };

  // ... (Restante da lógica do Scanner e WhatsApp permanece igual à anterior)
  // Certifique-se de manter as funções enviarConvite, iniciarScanner e fecharScanner aqui dentro
