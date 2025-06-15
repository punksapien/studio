
'use client';

import * as React from 'react';
import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UploadCloud, AlertTriangle, CheckCircle2, Loader2, Users, Briefcase, DatabaseZap, ServerCrash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

// Helper for client-side CSV parsing
const parseCSV = (csvText: string): Record<string, string>[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

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

function DynamicFooterTimestamp() {
  const [timestamp, setTimestamp] = useState('');

  useEffect(() => {
    setTimestamp(new Date().toISOString());
  }, []);

  return <>{timestamp}</>;
}

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
    setUserLog([`[${new Date().toLocaleTimeString()}] Processing user CSV: ${userCsvFile.name}`]);

    try {
      const fileText = await userCsvFile.text();
      const parsedData = parseCSV(fileText);

      setUserLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Parsed ${parsedData.length} user records.`]);

      if (parsedData.length === 0) {
        setUserLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Warning: CSV is empty or has no data rows.`]);
        setIsProcessingUsers(false);
        return;
      }

      const response = await fetch('/api/admin/hack-tool/batch-add-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: parsedData, role: userRole }),
      });
      const result = await response.json();

      if (response.ok) {
        setUserLog(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] API Response: Processed ${result.processed}. Successful: ${result.successful}. Failed: ${result.failed}.`,
          ...(result.errors || []).map((err: string) => `[${new Date().toLocaleTimeString()}] ERROR: ${err}`)
        ]);
        toast({ title: 'User Batch Processing Complete', description: `Processed ${result.processed} users.` });
      } else {
        throw new Error(result.error || 'Failed to process user batch.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
      setUserLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] FATAL ERROR: ${message}`]);
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
    setListingLog([`[${new Date().toLocaleTimeString()}] Processing listing CSV: ${listingCsvFile.name}`]);
    
    try {
      const fileText = await listingCsvFile.text();
      const parsedData = parseCSV(fileText);

      setListingLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Parsed ${parsedData.length} listing records.`]);

      if (parsedData.length === 0) {
        setListingLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Warning: CSV is empty or has no data rows.`]);
        setIsProcessingListings(false);
        return;
      }
      
      const response = await fetch('/api/admin/hack-tool/batch-add-listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listings: parsedData }),
      });
      const result = await response.json();

      if (response.ok) {
        setListingLog(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] API Response: Processed ${result.processed}. Successful: ${result.successful}. Failed: ${result.failed}.`,
          ...(result.errors || []).map((err: string) => `[${new Date().toLocaleTimeString()}] ERROR: ${err}`)
        ]);
        toast({ title: 'Listing Batch Processing Complete', description: `Processed ${result.processed} listings.` });
      } else {
        throw new Error(result.error || 'Failed to process listing batch.');
      }
    } catch (error) {
       const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
      setListingLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] FATAL ERROR: ${message}`]);
      toast({ title: 'Error Processing Listings', description: message, variant: 'destructive' });
    } finally {
      setIsProcessingListings(false);
    }
  }, [listingCsvFile, toast]);

  const logAreaClasses = "bg-muted/30 border border-border rounded-md p-4 h-64 text-xs space-y-1";

  return (
    <div className="space-y-8">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <DatabaseZap className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground font-heading">
            Data Injection Hub
          </h1>
        </div>
        <p className="text-muted-foreground">
          Tool for batch importing user and listing data via CSV files. Use with caution.
        </p>
      </header>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" /> Batch Add Users
          </TabsTrigger>
          <TabsTrigger value="listings">
            <Briefcase className="h-4 w-4 mr-2" /> Batch Add Listings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="mr-1 h-5 w-5 text-primary"/>User Data Stream Input</CardTitle>
              <CardDescription>
                Upload CSV for Seller/Buyer profiles. Expected columns: email, fullName, password, phoneNumber, country, initialCompanyName (for sellers), buyerPersonaType (for buyers), etc.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="userRole">Select User Role:</Label>
                <select
                  id="userRole"
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as 'buyer' | 'seller')}
                  className="mt-1 block w-full rounded-md border-input bg-background py-2 px-3 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                >
                  <option value="seller">Seller</option>
                  <option value="buyer">Buyer</option>
                </select>
              </div>
              <div>
                <Label htmlFor="userCsvFile">User Data CSV File:</Label>
                <Input id="userCsvFile" type="file" accept=".csv" onChange={handleFileChange(setUserCsvFile)} />
              </div>
              <Button onClick={processUserFile} disabled={!userCsvFile || isProcessingUsers}>
                {isProcessingUsers ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                Execute User Batch
              </Button>
              <div className="mt-4">
                <Label>Operation Log (Users):</Label>
                <ScrollArea className={logAreaClasses}>
                  {userLog.map((line, index) => (
                    <p key={index} className={line.includes('ERROR:') ? 'text-destructive' : line.includes('Warning:') ? 'text-yellow-600' : 'text-muted-foreground'}>
                      {line}
                    </p>
                  ))}
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="listings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Briefcase className="mr-1 h-5 w-5 text-primary"/>Listing Data Stream Input</CardTitle>
              <CardDescription>
                Upload CSV for business listings. Ensure 'sellerEmail' column matches an existing seller. Expected columns: sellerEmail, listingTitleAnonymous, industry, locationCountry, askingPrice, etc.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="listingCsvFile">Listing Data CSV File:</Label>
                <Input id="listingCsvFile" type="file" accept=".csv" onChange={handleFileChange(setListingCsvFile)} />
              </div>
              <Button onClick={processListingFile} disabled={!listingCsvFile || isProcessingListings}>
                 {isProcessingListings ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                Execute Listing Batch
              </Button>
              <div className="mt-4">
                <Label>Operation Log (Listings):</Label>
                 <ScrollArea className={logAreaClasses}>
                  {listingLog.map((line, index) => (
                     <p key={index} className={line.includes('ERROR:') ? 'text-destructive' : line.includes('Warning:') ? 'text-yellow-600' : 'text-muted-foreground'}>
                      {line}
                    </p>
                  ))}
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <footer className="mt-10 text-center">
        <p className="text-xs text-muted-foreground">
          Nobridge Data Protocol // System Time: <DynamicFooterTimestamp />
        </p>
      </footer>
    </div>
  );
}
