import App from './App';
import SubirArchivo from './SubirArchivo';
import Protegido from './Protegido';
import LoginPage from './LoginPage'; // 👈 nueva página

<BrowserRouter>
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/" element={<Protegido><App /></Protegido>} />
    <Route path="/subir" element={<Protegido><SubirArchivo /></Protegido>} />
  </Routes>
</BrowserRouter>


