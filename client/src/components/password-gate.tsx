import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lock, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PasswordGateProps {
  onUnlock: () => void;
}

export function PasswordGate({ onUnlock }: PasswordGateProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsValidating(true);

    // Simulate brief validation delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Client-side password validation for static deployment
    // The password is "colony2024" - this is a simple access gate, not security-critical
    const validPassword = 'colony2024';

    if (password === validPassword) {
      onUnlock();
      toast({ title: 'Access Granted', description: 'Welcome to Colony Bank ETL Tool' });
    } else {
      setError(true);
      toast({ title: 'Access Denied', description: 'Incorrect password.', variant: 'destructive' });
    }

    setIsValidating(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-slate-200">
        <CardHeader className="text-center space-y-2 pb-2">
          <div className="mx-auto w-12 h-12 bg-[#003366] rounded-full flex items-center justify-center mb-2">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-xl font-bold text-[#003366]">Colony Bank HMDA/CRA</CardTitle>
          <CardDescription>Enter authorized password to access ETL tools</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Enter Password"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                className={error ? 'border-red-500 focus-visible:ring-red-500' : ''}
                disabled={isValidating}
                data-testid="input-password"
              />
              {error && (
                <div className="flex items-center gap-1.5 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>Incorrect password. Please try again.</span>
                </div>
              )}
            </div>
            <Button
              type="submit"
              className="w-full bg-[#003366] hover:bg-[#002244]"
              disabled={isValidating}
              data-testid="button-authenticate"
            >
              {isValidating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                'Authenticate'
              )}
            </Button>
          </form>
          <div className="mt-6 text-center text-xs text-muted-foreground">
            Authorized Personnel Only • {new Date().getFullYear()} Colony Bank
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
