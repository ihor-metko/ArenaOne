"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Modal, Button } from "@/components/ui";

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthPromptModal({ isOpen, onClose }: AuthPromptModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations();

  // Construct the current URL to redirect back to after login
  const getCurrentUrl = () => {
    const currentSearchParams = searchParams.toString();
    return currentSearchParams ? `${pathname}?${currentSearchParams}` : pathname;
  };

  const handleLogin = () => {
    const redirectTo = encodeURIComponent(getCurrentUrl());
    router.push(`/auth/sign-in?redirectTo=${redirectTo}`);
  };

  const handleRegister = () => {
    const redirectTo = encodeURIComponent(getCurrentUrl());
    router.push(`/auth/sign-up?redirectTo=${redirectTo}`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("auth.promptTitle")}
    >
      <div className="tm-auth-prompt">
        <p className="tm-auth-prompt-text text-gray-600 dark:text-gray-400 mb-6">
          {t("auth.promptMessage")}
        </p>

        <div className="tm-auth-prompt-actions flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="tm-auth-prompt-continue"
          >
            {t("auth.continueBrowsing")}
          </Button>
          <Button
            variant="outline"
            onClick={handleRegister}
            className="tm-auth-prompt-register"
          >
            {t("common.register")}
          </Button>
          <Button
            onClick={handleLogin}
            className="tm-auth-prompt-login"
          >
            {t("common.signIn")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
