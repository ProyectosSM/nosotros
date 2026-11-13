const SUPABASE_URL = 'https://iomkqhlwqisymmdujhol.supabase.co/rest/v1/'; // (Tu URL de Data API)
const SUPABASE_KEY = 'sb_publishable_HmLROH5i9GLGWWWKrBPStw_Hzh69upn'; // (Tu Publishable key que ves en la imagen)
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- PEGA AQUÍ TUS CREDENCIALES DE SUPABASE ---
const SUPABASE_URL = 'TU_SUPABASE_URL_AQUI';
const SUPABASE_KEY = 'TU_PUBLISHABLE_KEY_AQUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 1. Login inteligente (Admin vs Fiscal)
app.post('/login', async (req, res) => {
    const { usuario, password } = req.body;
    
    const { data } = await supabase
        .from('usuarios')
        .select('*')
        .eq('usuario', usuario)
        .eq('password', password)
        .single();

    if (data) {
        if (data.rol === 'admin') {
            return res.redirect('/admin.html');
        }
        const params = new URLSearchParams({
            fiscal: data.nombre_fiscal,
            mesa: data.numero_mesa
        });
        res.redirect(`/app.html?${params.toString()}`);
    } else {
        res.send(`<script>alert('Usuario o contraseña incorrectos'); window.location.href='/';</script>`);
    }
});

// 2. Registro público para que cada fiscal cree su cuenta
app.post('/registro', async (req, res) => {
    const { usuario, password, nombre_fiscal, numero_mesa } = req.body;

    const { error } = await supabase
        .from('usuarios')
        .insert([{ usuario, password, nombre_fiscal, numero_mesa, rol: 'fiscal' }]);

    if (error) {
        return res.status(400).json({ ok: false, error: 'Ese usuario ya existe o hubo un error.' });
    }
    res.json({ ok: true });
});

// 3. Obtener todos los usuarios para el panel Admin
app.get('/api/usuarios', async (req, res) => {
    const { data, error } = await supabase
        .from('usuarios')
        .select('id, usuario, password, nombre_fiscal, numero_mesa, rol')
        .order('id', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// 4. Eliminar un usuario desde el panel Admin
app.delete('/api/usuarios/:id', async (req, res) => {
    const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', req.params.id);

    if (error) return res.status(500).json({ ok: false, error: error.message });
    res.json({ ok: true });
});

// 5. Guardar reporte de votación
app.post('/guardar-reporte', async (req, res) => {
    const { error } = await supabase
        .from('reportes_mesas')
        .insert([req.body]);

    if (error) return res.status(500).json({ ok: false, error: error.message });
    res.json({ ok: true });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});
