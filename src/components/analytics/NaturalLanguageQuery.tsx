
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";  
import { Loader2, Search, Lightbulb, Database, Sparkles, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";
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

  const renderDataQualityBadge = (result: any) => {
    if (!result.dataQuality) return null;

    const { validatedResults, unvalidatedResults, qualityScore } = result.dataQuality;
    const total = validatedResults + unvalidatedResults;

    return (
      <div className="flex items-center gap-2 mt-2">
        <Badge variant={qualityScore >= 70 ? "default" : "secondary"} className="text-xs">
          {qualityScore >= 70 ? (
            <CheckCircle className="h-3 w-3 mr-1" />
          ) : (
            <AlertCircle className="h-3 w-3 mr-1" />
          )}
          Quality: {qualityScore}%
        </Badge>
        <span className="text-xs text-muted-foreground">
          ({validatedResults} validated, {unvalidatedResults} unvalidated)
        </span>
      </div>
    );
  };

  const renderDataProfileInsights = (result: any) => {
    if (!result.dataProfile) return null;

    const { validation_rate, total_documents, available_data } = result.dataProfile;

    return (
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">Data Insights</span>
        </div>
        <div className="text-xs text-blue-700 space-y-1">
          <div>📊 Document validation rate: {validation_rate}%</div>
          <div>📁 Total documents: {total_documents}</div>
          {available_data && (
            <>
              <div>🏥 Available fitness statuses: {available_data.fitness_statuses.join(', ')}</div>
              <div>🔬 Available test types: {available_data.test_types.join(', ')}</div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            Enhanced AI-Powered Natural Language Query
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Advanced query system with data profiling, semantic search, and validation-aware results. 
            Powered by ChatGPT with real-time data intelligence.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., Show me workers with expired certificates or Find unvalidated documents"
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

          {/* Enhanced Suggested Queries */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lightbulb className="h-4 w-4" />
              Try these intelligent suggestions:
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {suggestedQueries.slice(0, 8).map((suggestion, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-muted justify-start p-2 h-auto text-left"
                  onClick={() => handleSuggestedQuery(suggestion)}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          </div>

          {/* Enhanced AI Capabilities Notice */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-blue-500 mt-0.5" />
              <div className="text-sm text-blue-700">
                <strong>Enhanced AI Features:</strong>
                <ul className="mt-1 text-xs space-y-1">
                  <li>• Real-time data profiling and intelligent query mapping</li>
                  <li>• Semantic search across document content and extracted data</li>
                  <li>• Validation-aware results with quality indicators</li>
                  <li>• Automatic fallback between structured and semantic search</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Results Display */}
      {lastResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Query Results
              {lastResult.success && (
                <div className="flex items-center gap-2 ml-auto">
                  <Badge variant="secondary">
                    {lastResult.rowCount || lastResult.data?.length || 0} {(lastResult.rowCount || lastResult.data?.length || 0) === 1 ? 'result' : 'results'}
                  </Badge>
                  {lastResult.searchType && (
                    <Badge variant={lastResult.searchType === 'semantic' ? "outline" : "default"}>
                      {lastResult.searchType === 'semantic' ? 'Document Search' : 'Database Query'}
                    </Badge>
                  )}
                </div>
              )}
            </CardTitle>
            {lastResult.queryExplanation && (
              <p className="text-sm text-muted-foreground">
                {lastResult.queryExplanation}
              </p>
            )}
            
            {/* Data Quality Information */}
            {lastResult.success && lastResult.dataQuality && (
              <div className="mt-2">
                {renderDataQualityBadge(lastResult)}
                {lastResult.dataQuality.warning && (
                  <Alert className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {lastResult.dataQuality.warning}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
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
                            {Object.entries(row).map(([key, value], cellIndex) => (
                              <td key={cellIndex} className="border border-gray-200 px-3 py-2">
                                {key === 'data_quality' ? (
                                  <Badge variant={value === 'validated' ? "default" : "destructive"} className="text-xs">
                                    {value === 'validated' ? '✅ Validated' : '⚠️ Unvalidated'}
                                  </Badge>
                                ) : key === 'warning' && value ? (
                                  <span className="text-xs text-yellow-600 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {String(value)}
                                  </span>
                                ) : value === null ? (
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
                      No results found for your query. Try rephrasing or use a different approach.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Recommendation */}
                {lastResult.recommendation && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="text-sm text-green-800">
                      <strong>💡 Recommendation:</strong> {lastResult.recommendation}
                    </div>
                  </div>
                )}

                {/* Data Profile Insights */}
                {renderDataProfileInsights(lastResult)}
              </div>
            ) : (
              <div className="space-y-4">
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

                {/* Data Profile for Failed Queries */}
                {renderDataProfileInsights(lastResult)}
              </div>
            )}

            {/* Enhanced Suggested Follow-up Queries */}
            {lastResult.suggestedQueries && lastResult.suggestedQueries.length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Try these related queries:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {lastResult.suggestedQueries.slice(0, 6).map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSuggestedQuery(suggestion)}
                      className="justify-start text-left h-auto py-2 px-3 whitespace-normal text-xs"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NaturalLanguageQuery;
