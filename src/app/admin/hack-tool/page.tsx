
'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UploadCloud, AlertTriangle, CheckCircle2, Loader2, FlaskConical, Binary, TerminalSquare, Settings2, BrainCircuit, Users, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Helper for client-side CSV parsing
const parseCSV = (csvText: string): Record<string, string>[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return []; // Must have header and at least one data row

  const header = lines[0].split(',').map(h => h.trim());
  const data = lines.slice(1).map(line => {
    const values = line.split(',');
    const row: Record<string, string> = {};
    header.forEach((key, index) => {
      row[key] = values[index]?.trim() || '';
    });
    return row;
  });
  return data;
};

export default function HackToolPage() {
  const { toast } = useToast();
  const [userCsvFile, setUserCsvFile] = useState<File | null>(null);
  const [listingCsvFile, setListingCsvFile] = useState<File | null>(null);
  const [userRole, setUserRole] = useState<'buyer' | 'seller'>('seller');
  const [isProcessingUsers, setIsProcessingUsers] = useState(false);
  const [isProcessingListings, setIsProcessingListings] = useState(false);
  const [userLog, setUserLog] = useState<string[]>([]);
  const [listingLog, setListingLog] = useState<string[]>([]);

  const handleFileChange = (setter: React.Dispatch<React.SetStateAction<File | null>>) => (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setter(event.target.files[0]);
    } else {
      setter(null);
    }
  };

  const processUserFile = useCallback(async () => {
    if (!userCsvFile) {
      toast({ title: 'No File Selected', description: 'Please select a CSV file for users.', variant: 'destructive' });
      return;
    }
    setIsProcessingUsers(true);
    setUserLog(['Processing user CSV...']);

    try {
      const fileText = await userCsvFile.text();
      const parsedData = parseCSV(fileText);

      setUserLog(prev => [...prev, `Parsed ${parsedData.length} user records.`]);

      if (parsedData.length === 0) {
        setUserLog(prev => [...prev, 'Warning: CSV is empty or has no data rows.']);
        setIsProcessingUsers(false);
        return;
      }

      // Simulate API call
      const response = await fetch('/api/admin/hack-tool/batch-add-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: parsedData, role: userRole }),
      });
      const result = await response.json();

      if (response.ok) {
        setUserLog(prev => [
          ...prev,
          `API Response: Processed ${result.processed}. Successful: ${result.successful}. Failed: ${result.failed}.`,
          ...(result.errors || []).map((err: string) => `ERROR: ${err}`)
        ]);
        toast({ title: 'User Batch Processing Complete', description: `Processed ${result.processed} users.` });
      } else {
        throw new Error(result.error || 'Failed to process user batch.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
      setUserLog(prev => [...prev, `FATAL ERROR: ${message}`]);
      toast({ title: 'Error Processing Users', description: message, variant: 'destructive' });
    } finally {
      setIsProcessingUsers(false);
    }
  }, [userCsvFile, userRole, toast]);

  const processListingFile = useCallback(async () => {
    if (!listingCsvFile) {
      toast({ title: 'No File Selected', description: 'Please select a CSV file for listings.', variant: 'destructive' });
      return;
    }
    setIsProcessingListings(true);
    setListingLog(['Processing listing CSV...']);
    
    try {
      const fileText = await listingCsvFile.text();
      const parsedData = parseCSV(fileText);

      setListingLog(prev => [...prev, `Parsed ${parsedData.length} listing records.`]);

      if (parsedData.length === 0) {
        setListingLog(prev => [...prev, 'Warning: CSV is empty or has no data rows.']);
        setIsProcessingListings(false);
        return;
      }
      
      // Simulate API call
      const response = await fetch('/api/admin/hack-tool/batch-add-listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listings: parsedData }),
      });
      const result = await response.json();

      if (response.ok) {
        setListingLog(prev => [
          ...prev,
          `API Response: Processed ${result.processed}. Successful: ${result.successful}. Failed: ${result.failed}.`,
          ...(result.errors || []).map((err: string) => `ERROR: ${err}`)
        ]);
        toast({ title: 'Listing Batch Processing Complete', description: `Processed ${result.processed} listings.` });
      } else {
        throw new Error(result.error || 'Failed to process listing batch.');
      }
    } catch (error) {
       const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
      setListingLog(prev => [...prev, `FATAL ERROR: ${message}`]);
      toast({ title: 'Error Processing Listings', description: message, variant: 'destructive' });
    } finally {
      setIsProcessingListings(false);
    }
  }, [listingCsvFile, toast]);

  // Steins;Gate inspired theme for this page
  const themeClasses = "bg-gray-900 text-green-400 min-h-screen p-6 md:p-8 lg:p-10";
  const cardClasses = "bg-gray-800 border-green-500/30 shadow-xl shadow-green-500/10";
  const titleClasses = "text-2xl font-bold text-green-300 font-mono tracking-wider flex items-center";
  const descriptionClasses = "text-sm text-green-500/80 font-mono";
  const labelClasses = "text-green-400 font-mono";
  const inputClasses = "bg-gray-700 border-green-500/50 text-green-300 placeholder-green-600/70 focus:ring-green-500 focus:border-green-500 font-mono";
  const buttonClasses = "bg-green-500 hover:bg-green-600 text-gray-900 font-mono font-semibold";
  const logAreaClasses = "bg-black border border-green-500/30 rounded-md p-4 h-64 overflow-y-auto font-mono text-xs space-y-1";
  const tabTriggerClasses = "font-mono text-green-400 data-[state=active]:bg-green-500/10 data-[state=active]:text-green-300 data-[state=active]:shadow-inner data-[state=active]:shadow-green-500/20";
  const tabListClasses = "bg-gray-800/50 border border-green-500/30";

  return (
    <div className={themeClasses}>
      <header className="mb-12 text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <BrainCircuit className="h-12 w-12 text-green-400 animate-pulse" />
          <h1 className="text-4xl md:text-5xl font-bold text-green-300 font-mono tracking-tighter animate-subtle-glow">
            NOBRIDGE DATA_INJECTION_TERMINAL
          </h1>
          <Settings2 className="h-12 w-12 text-green-400 animate-spin-slow" />
        </div>
        <p className="text-lg text-green-500/90 font-mono">
          // System Status: Online - Awaiting Directives_
        </p>
        <p className="text-xs text-green-600/70 font-mono mt-1">
          // EL_PSY_KONGROO_SEQUENCE_INITIATED
        </p>
      </header>

      <Tabs defaultValue="users" className="w-full max-w-4xl mx-auto">
        <TabsList className={`grid w-full grid-cols-2 mb-8 ${tabListClasses}`}>
          <TabsTrigger value="users" className={tabTriggerClasses}>
            <Users className="h-4 w-4 mr-2" /> Batch Users
          </TabsTrigger>
          <TabsTrigger value="listings" className={tabTriggerClasses}>
            <Briefcase className="h-4 w-4 mr-2" /> Batch Listings
          </TabsTrigger>
        </TabsList>

        {/* Batch Add Users Tab */}
        <TabsContent value="users">
          <Card className={cardClasses}>
            <CardHeader>
              <CardTitle className={titleClasses}>
                <TerminalSquare className="mr-3 h-7 w-7"/>User Data Stream Input
              </CardTitle>
              <CardDescription className={descriptionClasses}>
                // Upload CSV for Seller/Buyer profiles. Columns: email, fullName, password, phoneNumber, country, initialCompanyName (for sellers), buyerPersonaType (for buyers), etc.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="userRole" className={labelClasses}>Select User Role:</Label>
                <select
                  id="userRole"
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as 'buyer' | 'seller')}
                  className={`mt-1 block w-full rounded-md py-2 px-3 shadow-sm ${inputClasses}`}
                >
                  <option value="seller">Seller</option>
                  <option value="buyer">Buyer</option>
                </select>
              </div>
              <div>
                <Label htmlFor="userCsvFile" className={labelClasses}>User Data CSV File:</Label>
                <Input id="userCsvFile" type="file" accept=".csv" onChange={handleFileChange(setUserCsvFile)} className={inputClasses} />
              </div>
              <Button onClick={processUserFile} disabled={!userCsvFile || isProcessingUsers} className={buttonClasses}>
                {isProcessingUsers ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                Execute User Batch
              </Button>
              <div className="mt-4">
                <Label className={labelClasses}>Operation Log (Users):</Label>
                <div className={logAreaClasses}>
                  {userLog.map((line, index) => (
                    <p key={index} className={line.startsWith('ERROR:') ? 'text-red-400' : line.startsWith('Warning:') ? 'text-yellow-400' : 'text-green-400'}>
                      <span className="text-green-600 animate-pulse-subtle-prefix">{`> `}</span>{line}
                    </p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Batch Add Listings Tab */}
        <TabsContent value="listings">
          <Card className={cardClasses}>
            <CardHeader>
              <CardTitle className={titleClasses}>
                <Binary className="mr-3 h-7 w-7"/>Listing Data Stream Input
              </CardTitle>
              <CardDescription className={descriptionClasses}>
                // Upload CSV for business listings. Ensure 'sellerEmail' column matches an existing seller. Columns: sellerEmail, listingTitleAnonymous, industry, locationCountry, askingPrice, etc.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="listingCsvFile" className={labelClasses}>Listing Data CSV File:</Label>
                <Input id="listingCsvFile" type="file" accept=".csv" onChange={handleFileChange(setListingCsvFile)} className={inputClasses} />
              </div>
              <Button onClick={processListingFile} disabled={!listingCsvFile || isProcessingListings} className={buttonClasses}>
                 {isProcessingListings ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                Execute Listing Batch
              </Button>
              <div className="mt-4">
                <Label className={labelClasses}>Operation Log (Listings):</Label>
                <div className={logAreaClasses}>
                  {listingLog.map((line, index) => (
                     <p key={index} className={line.startsWith('ERROR:') ? 'text-red-400' : line.startsWith('Warning:') ? 'text-yellow-400' : 'text-green-400'}>
                      <span className="text-green-600 animate-pulse-subtle-prefix">{`> `}</span>{line}
                    </p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <footer className="mt-12 text-center">
        <p className="text-xs text-green-600/70 font-mono">
          // Nobridge_Data_Integrity_Protocol_v2.3 // System_Time: {new Date().toISOString()}
        </p>
      </footer>
    </div>
  );
}
