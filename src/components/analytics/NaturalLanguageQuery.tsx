
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Lightbulb, Database } from "lucide-react";
import { useNaturalLanguageQuery } from '@/hooks/useNaturalLanguageQuery';
import { Alert, AlertDescription } from "@/components/ui/alert";

const NaturalLanguageQuery: React.FC = () => {
  const [query, setQuery] = useState('');
  const { executeQuery, isLoading, lastResult, getSuggestedQueries } = useNaturalLanguageQuery();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      await executeQuery(query);
    }
  };

  const handleSuggestedQuery = (suggestedQuery: string) => {
    setQuery(suggestedQuery);
  };

  const suggestedQueries = getSuggestedQueries();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Natural Language Query
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Ask questions about your medical data in plain English
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., Show me patients with expired certificates"
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !query.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </form>

          {/* Suggested Queries */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lightbulb className="h-4 w-4" />
              Try these examples:
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestedQueries.slice(0, 4).map((suggestion, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleSuggestedQuery(suggestion)}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {lastResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Query Results
              {lastResult.success && (
                <Badge variant="secondary">
                  {lastResult.rowCount} {lastResult.rowCount === 1 ? 'row' : 'rows'}
                </Badge>
              )}
            </CardTitle>
            {lastResult.queryExplanation && (
              <p className="text-sm text-muted-foreground">
                {lastResult.queryExplanation}
              </p>
            )}
          </CardHeader>
          <CardContent>
            {lastResult.success ? (
              <div className="space-y-4">
                {lastResult.data && lastResult.data.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-200 text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          {Object.keys(lastResult.data[0]).map((key) => (
                            <th key={key} className="border border-gray-200 px-3 py-2 text-left font-medium">
                              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {lastResult.data.map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            {Object.values(row).map((value, cellIndex) => (
                              <td key={cellIndex} className="border border-gray-200 px-3 py-2">
                                {value === null ? (
                                  <span className="text-gray-400">-</span>
                                ) : typeof value === 'boolean' ? (
                                  <Badge variant={value ? "default" : "secondary"}>
                                    {value ? 'Yes' : 'No'}
                                  </Badge>
                                ) : (
                                  String(value)
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Alert>
                    <AlertDescription>
                      No results found for your query.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertDescription>
                  {lastResult.error}
                  {lastResult.hint && (
                    <div className="mt-2 text-sm">
                      <strong>Hint:</strong> {lastResult.hint}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NaturalLanguageQuery;
