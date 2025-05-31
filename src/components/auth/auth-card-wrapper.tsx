
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Logo } from "@/components/shared/logo";
import Link from "next/link";

interface AuthCardWrapperProps {
  children: React.ReactNode;
  headerLabel: string;
  backButtonLabel: string;
  backButtonHref: string;
  showSocial?: boolean;
}

export const AuthCardWrapper = ({
  children,
  headerLabel,
  backButtonLabel,
  backButtonHref,
  showSocial
}: AuthCardWrapperProps) => {
  return (
    <Card className="w-full max-w-md shadow-xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          {/* Auth pages have light background, so force light theme for logo to pick dark elements */}
          <Logo size="2xl" forceTheme="light" />
        </div>
        <p className="text-muted-foreground text-sm">{headerLabel}</p>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
      {showSocial && (
        <CardFooter>
          <p className="text-xs text-muted-foreground text-center w-full">Or continue with social...</p>
        </CardFooter>
      )}
      <CardFooter className="flex-col items-center justify-center">
        <Link
          href={backButtonHref}
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          {backButtonLabel}
        </Link>
      </CardFooter>
    </Card>
  );
};
