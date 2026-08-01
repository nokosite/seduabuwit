import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function LoginSection({ showToast }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      showToast('Masukkan email terdaftar', 'error');
      return;
    }
    setForgotLoading(true);
    try {
      await sendPasswordResetEmail(auth, forgotEmail);
      showToast('Email reset password telah dikirim. Periksa kotak masuk Anda.', 'success');
      setShowForgotModal(false);
      setForgotEmail('');
    } catch (err) {
      let msg = 'Gagal mengirim email reset password';
      if (err.code === 'auth/user-not-found') msg = 'Email tidak terdaftar di sistem';
      else if (err.code === 'auth/invalid-email') msg = 'Format email tidak valid';
      showToast(msg, 'error');
    }
    setForgotLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      showToast('Email dan password harus diisi!', 'error');
      return;
    }

    setIsLoading(true);

    const result = await login(email, password);

    if (result.success) {
      showToast(`Login berhasil sebagai ${result.role === 'admin' ? 'Admin' : 'Orang Tua'}!`, 'success');
    } else {
      // Display error message from AuthContext with error type
      showToast(result.error || 'Login gagal! Silakan coba lagi.', 'error');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] auth-geometric-bg">
      <div className="container mx-auto flex items-center justify-center min-h-screen py-8">
        <div className="w-full max-w-6xl">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="grid md:grid-cols-2">
              {/* Left Side - Image/Illustration */}
              <div className="hidden md:block relative bg-gradient-to-br from-green-600 via-green-500 to-emerald-400 p-12">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMC0xMGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>

                <div className="relative z-10 h-full flex flex-col justify-center items-center">
                  {/* Logo SDN 2 Buwit */}
                  <div className="mb-6 flex flex-col items-center">
                    <div className="w-32 h-32 mb-4 bg-white rounded-2xl p-3 shadow-xl">
                      <img
                        src="/logo-sdn2buwit.jpeg"
                        alt="Logo SDN 2 Buwit"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-3 text-center">
                      SDN 2 Buwit
                    </h2>
                    <p className="text-white/90 text-base leading-relaxed text-center max-w-sm px-4">
                      Sistem Pembayaran Sumbangan Digital yang memudahkan orang tua dalam melakukan pembayaran Sumbangan Sukarela secara online.
                    </p>
                  </div>

                  <div className="space-y-3 mt-6 w-full max-w-sm px-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                        <i className="ph-fill ph-check text-white text-lg"></i>
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-sm mb-0.5">Pembayaran Mudah</h3>
                        <p className="text-white/80 text-xs">Bayar Sumbangan Sukarela kapan saja dengan berbagai metode</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                        <i className="ph-fill ph-shield-check text-white text-lg"></i>
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-sm mb-0.5">Aman & Terpercaya</h3>
                        <p className="text-white/80 text-xs">Transaksi dijamin aman dengan sistem berlapis</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                        <i className="ph-fill ph-clock-clockwise text-white text-lg"></i>
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-sm mb-0.5">Riwayat Lengkap</h3>
                        <p className="text-white/80 text-xs">Pantau riwayat dan unduh kuitansi digital</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Login Form */}
              <div className="p-8 md:p-10 flex flex-col justify-center">
                {/* Logo */}
                <div className="mb-6">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src="/logo-sdn2buwit.jpeg"
                        alt="Logo SDN 2 Buwit"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h1 className="text-lg font-bold text-gray-900">SDN 2 Buwit</h1>
                      <p className="text-[10px] text-gray-500">Sistem Pembayaran Sumbangan Sukarela</p>
                    </div>
                  </div>
                </div>

                {/* Welcome Text */}
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-1.5">Selamat Datang</h2>
                  <p className="text-gray-600 text-sm">
                    Silahkan masuk ke Sistem Pembayaran Sumbangan Sukarela SDN 2 Buwit
                  </p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-gray-700 font-medium text-sm">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Masukkan email..."
                      className="h-10"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password" className="text-gray-700 font-medium text-sm">
                        Password
                      </Label>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotEmail(email);
                          setShowForgotModal(true);
                        }}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        Lupa password?
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Masukkan password..."
                        className="h-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <i className={`ph ${showPassword ? 'ph-eye-slash' : 'ph-eye'} text-lg`}></i>
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-10 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-medium"
                  >
                    {isLoading ? (
                      <>
                        <i className="ph ph-spinner animate-spin text-xl mr-2"></i>
                        Memproses...
                      </>
                    ) : (
                      <>
                        <i className="ph-fill ph-sign-in mr-2"></i>
                        Masuk
                      </>
                    )}
                  </Button>
                </form>

                {/* Footer */}
                <div className="mt-6 text-center">
                  <p className="text-xs text-gray-500">
                    © 2026 SDN 2 Buwit. Sistem Pembayaran Sumbangan Sukarela Digital
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="relative bg-gradient-to-br from-emerald-700 via-emerald-600 to-green-500 p-6 text-white overflow-hidden">
              <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-white/10"></div>
              <div className="relative">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center ring-1 ring-white/30 mb-3">
                  <i className="ph-fill ph-key text-2xl text-white"></i>
                </div>
                <h3 className="text-lg font-bold">Reset Password</h3>
                <p className="text-xs text-emerald-50/90">Kami akan kirim tautan reset ke email Anda</p>
              </div>
            </div>
            <form onSubmit={handleForgotPassword} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="forgotEmail" className="text-gray-700 font-medium text-sm">
                  Email Terdaftar
                </Label>
                <Input
                  id="forgotEmail"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                  autoFocus
                />
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-800 flex gap-2">
                <i className="ph-fill ph-info text-base flex-shrink-0"></i>
                <span>Periksa folder spam jika email tidak masuk dalam 1-2 menit.</span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForgotModal(false)}
                  disabled={forgotLoading}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex-[2] bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
                >
                  {forgotLoading ? (
                    <><i className="ph ph-spinner animate-spin mr-2"></i>Mengirim...</>
                  ) : (
                    <><i className="ph-fill ph-paper-plane-tilt mr-2"></i>Kirim Link Reset</>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginSection;
