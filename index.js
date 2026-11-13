onst express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Usar process.cwd() garantiza que Vercel encuentre la carpeta public
const publicDir = path.join(process.cwd(), 'public');
app.use(express.static(publicDir));

// URL limpia sin /rest/v1/
const SUPABASE_URL = 'https://iomkqhlwqisymmdujhol.supabase.co/rest/v1/';
const SUPABASE_KEY = 'sb_publishable_HmLROH5i9GLGWWWKrBPStw_Hzh69upn';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 1. Login inteligente (Admin vs Fiscal)
app.post('/login', async (req, res) => {
    try {
        const { usuario, password } = req.body;
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('usuario', usuario)
            .eq('password', password)
            .single();

        if (error || !data) {
            return res.send(`<script>alert('Usuario o contraseña incorrectos'); window.location.href='/';</script>`);
        }

        if (data.rol === 'admin') {
            return res.redirect('/admin.html');
        }

        const params = new URLSearchParams({
            fiscal: data.nombre_fiscal,
            mesa: data.numero_mesa
        });
        res.redirect(`/app.html?${params.toString()}`);
    } catch (err) {
        res.status(500).send('Error en el servidor: ' + err.message);
    }
});

// 2. Registro público
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

// 3. Listar usuarios (Admin)
app.get('/api/usuarios', async (req, res) => {
    const { data, error } = await supabase
        .from('usuarios')
        .select('id, usuario, password, nombre_fiscal, numero_mesa, rol')
        .order('id', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// 4. Eliminar usuario (Admin)
app.delete('/api/usuarios/:id', async (req, res) => {
    const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', req.params.id);

    if (error) return res.status(500).json({ ok: false, error: error.message });
    res.json({ ok: true });
});

// 5. Guardar reporte
app.post('/guardar-reporte', async (req, res) => {
    const { error } = await supabase
        .from('reportes_mesas')
        .insert([req.body]);

    if (error) return res.status(500).json({ ok: false, error: error.message });
    res.json({ ok: true });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(publicDir, 'login.html'));
});

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en puerto ${PORT}`);
    });
}
