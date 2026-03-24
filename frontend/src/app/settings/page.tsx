"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import { User, Settings, Mail, FileText, Link as LinkIcon, Loader2, ShieldCheck, ShieldOff, Copy, Check } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface FormErrors {
  username?: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
  general?: string;
}

export default function SettingsPage() {
  const { user, token, isLoading: authLoading, updateUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [role, setRole] = useState<"CLIENT" | "FREELANCER">("FREELANCER");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  // ─── 2FA State ──────────────────────────────────────────────────────────────
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFASetupData, setTwoFASetupData] = useState<{
    qrCode: string;
    secret: string;
    backupCodes: string[];
  } | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !token) {
      router.push("/");
    }
  }, [authLoading, token, router]);

  // Fetch latest profile data and pre-fill form
  useEffect(() => {
    if (!token) return;

    async function fetchProfile() {
      try {
        const res = await axios.get(`${API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data;
        setUsername(data.username || "");
        setEmail(data.email || "");
        setBio(data.bio || "");
        setAvatarUrl(data.avatarUrl || "");
        setRole(data.role || "FREELANCER");
        setTwoFAEnabled(data.twoFactorEnabled || false);
      } catch {
        toast.error("Failed to load profile data.");
      } finally {
        setIsPageLoading(false);
      }
    }

    fetchProfile();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Client-side validation
  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (!username || username.length < 3) {
      newErrors.username = "Username must be at least 3 characters.";
    } else if (username.length > 30) {
      newErrors.username = "Username must be at most 30 characters.";
    } else if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      newErrors.username = "Username can only contain letters, numbers, hyphens, and underscores.";
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (bio && bio.length > 500) {
      newErrors.bio = "Bio must be at most 500 characters.";
    }

    if (avatarUrl && !/^https?:\/\/.+/.test(avatarUrl)) {
      newErrors.avatarUrl = "Please enter a valid URL.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    setErrors({});

    try {
      const payload: Record<string, any> = { // eslint-disable-line @typescript-eslint/no-explicit-any
        username,
        role,
      };
      if (email) payload.email = email;
      else payload.email = null;
      if (bio) payload.bio = bio;
      else payload.bio = null;
      if (avatarUrl) payload.avatarUrl = avatarUrl;
      else payload.avatarUrl = null;

      const res = await axios.put(`${API_URL}/users/me`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      updateUser(res.data);
      toast.success("Profile updated successfully!");
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      const message =
        error.response?.data?.error || "Failed to update profile. Please try again.";
      setErrors({ general: message });
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  if (authLoading || isPageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-stellar-blue" />
      </div>
    );
  }

  async function handleSetup2FA() {
    setTwoFALoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/2fa/setup`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTwoFASetupData(res.data);
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(error.response?.data?.error || "Failed to setup 2FA.");
    } finally {
      setTwoFALoading(false);
    }
  }

  async function handleVerify2FA(e: React.FormEvent) {
    e.preventDefault();
    setTwoFALoading(true);
    try {
      await axios.post(`${API_URL}/auth/2fa/verify`, { code: verifyCode }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTwoFAEnabled(true);
      setTwoFASetupData(null);
      setVerifyCode("");
      toast.success("2FA has been enabled successfully!");
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(error.response?.data?.error || "Invalid verification code.");
    } finally {
      setTwoFALoading(false);
    }
  }

  async function handleDisable2FA(e: React.FormEvent) {
    e.preventDefault();
    setTwoFALoading(true);
    try {
      await axios.post(`${API_URL}/auth/2fa/disable`, { password: disablePassword }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTwoFAEnabled(false);
      setShowDisableModal(false);
      setDisablePassword("");
      toast.success("2FA has been disabled.");
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(error.response?.data?.error || "Failed to disable 2FA.");
    } finally {
      setTwoFALoading(false);
    }
  }

  function copyBackupCodes() {
    if (twoFASetupData) {
      navigator.clipboard.writeText(twoFASetupData.backupCodes.join("\n"));
      setCopiedBackup(true);
      setTimeout(() => setCopiedBackup(false), 2000);
    }
  }

  if (!user) return null;

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Settings size={28} className="text-stellar-blue" />
          <h1 className="text-3xl font-bold text-theme-heading">Settings</h1>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-6">
          <h2 className="text-xl font-semibold text-theme-heading">Edit Profile</h2>

          {errors.general && (
            <div className="bg-theme-error/10 border border-theme-error/20 text-theme-error rounded-lg px-4 py-3 text-sm">
              {errors.general}
            </div>
          )}

          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-theme-heading mb-2">
              <span className="flex items-center gap-2">
                <User size={14} />
                Username
              </span>
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              placeholder="Your username"
              aria-describedby={errors.username ? "username-error" : undefined}
            />
            {errors.username && (
              <p id="username-error" className="text-theme-error text-xs mt-1">
                {errors.username}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-theme-heading mb-2">
              <span className="flex items-center gap-2">
                <Mail size={14} />
                Email
              </span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="your@email.com"
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <p id="email-error" className="text-theme-error text-xs mt-1">
                {errors.email}
              </p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-theme-heading mb-2">
              <span className="flex items-center gap-2">
                <FileText size={14} />
                Bio
              </span>
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="input-field min-h-[120px] resize-y"
              placeholder="Tell us about yourself..."
              maxLength={500}
              aria-describedby={errors.bio ? "bio-error" : "bio-count"}
            />
            <div className="flex justify-between mt-1">
              {errors.bio ? (
                <p id="bio-error" className="text-theme-error text-xs">
                  {errors.bio}
                </p>
              ) : (
                <span />
              )}
              <span id="bio-count" className="text-theme-text text-xs">
                {bio.length}/500
              </span>
            </div>
          </div>

          {/* Avatar URL */}
          <div>
            <label htmlFor="avatarUrl" className="block text-sm font-medium text-theme-heading mb-2">
              <span className="flex items-center gap-2">
                <LinkIcon size={14} />
                Avatar URL
              </span>
            </label>
            <input
              id="avatarUrl"
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="input-field"
              placeholder="https://example.com/avatar.png"
              aria-describedby={errors.avatarUrl ? "avatar-error" : undefined}
            />
            {errors.avatarUrl && (
              <p id="avatar-error" className="text-theme-error text-xs mt-1">
                {errors.avatarUrl}
              </p>
            )}
            {avatarUrl && !errors.avatarUrl && (
              <div className="mt-3 flex items-center gap-3">
                <Image
                  src={avatarUrl}
                  alt="Avatar preview"
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full object-cover border border-theme-border"
                  unoptimized
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
                <span className="text-theme-text text-xs">Preview</span>
              </div>
            )}
          </div>

          {/* Role Toggle */}
          <div>
            <label className="block text-sm font-medium text-theme-heading mb-3">
              Role
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRole("CLIENT")}
                className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${role === "CLIENT"
                    ? "bg-stellar-blue/20 border-stellar-blue text-stellar-blue"
                    : "bg-theme-card border-theme-border text-theme-text hover:border-theme-text"
                  }`}
                aria-pressed={role === "CLIENT"}
              >
                Client
              </button>
              <button
                type="button"
                onClick={() => setRole("FREELANCER")}
                className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${role === "FREELANCER"
                    ? "bg-stellar-purple/20 border-stellar-purple text-stellar-purple"
                    : "bg-theme-card border-theme-border text-theme-text hover:border-theme-text"
                  }`}
                aria-pressed={role === "FREELANCER"}
              >
                Freelancer
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>

        {/* Security — Two-Factor Authentication */}
        <div className="card space-y-6 mt-8">
          <h2 className="text-xl font-semibold text-dark-heading flex items-center gap-2">
            <ShieldCheck size={20} />
            Security
          </h2>

          {twoFAEnabled && !twoFASetupData ? (
            /* 2FA is ON */
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-900/20 border border-green-700/30 rounded-lg">
                <ShieldCheck size={20} className="text-green-400" />
                <p className="text-green-300 text-sm">Two-factor authentication is enabled.</p>
              </div>

              {showDisableModal ? (
                <form onSubmit={handleDisable2FA} className="space-y-3">
                  <p className="text-dark-muted text-sm">Enter your password to disable 2FA:</p>
                  <input
                    type="password"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    className="input-field"
                    placeholder="Your password"
                    required
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={twoFALoading}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {twoFALoading ? <Loader2 size={14} className="animate-spin" /> : <ShieldOff size={14} />}
                      Confirm Disable
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowDisableModal(false); setDisablePassword(""); }}
                      className="px-4 py-2 border border-dark-border text-dark-text rounded-lg text-sm hover:bg-dark-bg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowDisableModal(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-red-600/50 text-red-400 rounded-lg text-sm hover:bg-red-900/20 transition-colors"
                >
                  <ShieldOff size={14} />
                  Disable 2FA
                </button>
              )}
            </div>
          ) : twoFASetupData ? (
            /* Setup in progress */
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-dark-muted text-sm mb-4">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>
                <img
                  src={twoFASetupData.qrCode}
                  alt="2FA QR Code"
                  className="mx-auto w-48 h-48 rounded-lg border border-dark-border"
                />
              </div>

              <div>
                <p className="text-dark-muted text-xs mb-1">Manual entry key:</p>
                <code className="block p-2 bg-dark-bg border border-dark-border rounded text-sm text-dark-text break-all">
                  {twoFASetupData.secret}
                </code>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-dark-muted text-xs">Backup codes (save these securely):</p>
                  <button
                    type="button"
                    onClick={copyBackupCodes}
                    className="flex items-center gap-1 text-xs text-stellar-blue hover:underline"
                  >
                    {copiedBackup ? <Check size={12} /> : <Copy size={12} />}
                    {copiedBackup ? "Copied!" : "Copy all"}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {twoFASetupData.backupCodes.map((code, i) => (
                    <code
                      key={i}
                      className="block p-2 bg-dark-bg border border-dark-border rounded text-center text-sm text-dark-text font-mono"
                    >
                      {code}
                    </code>
                  ))}
                </div>
              </div>

              <form onSubmit={handleVerify2FA} className="space-y-3">
                <label className="block text-sm font-medium text-dark-heading">
                  Enter a code from your authenticator app to verify:
                </label>
                <input
                  type="text"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  className="input-field text-center tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  required
                  autoComplete="one-time-code"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={twoFALoading || verifyCode.length !== 6}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {twoFALoading ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                    Verify &amp; Enable
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTwoFASetupData(null); setVerifyCode(""); }}
                    className="px-4 py-2 border border-dark-border text-dark-text rounded-lg text-sm hover:bg-dark-bg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* 2FA is OFF */
            <div className="space-y-4">
              <p className="text-dark-muted text-sm">
                Add an extra layer of security to your account by enabling two-factor authentication with an authenticator app.
              </p>
              <button
                onClick={handleSetup2FA}
                disabled={twoFALoading}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {twoFALoading ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                Enable 2FA
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
