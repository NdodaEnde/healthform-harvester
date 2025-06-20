
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useEnhancedAnalytics } from '@/hooks/useEnhancedAnalytics';
import { Search, Filter, Download, Eye, TrendingUp, Calendar, Users, Building2, ChevronDown, SortAsc, SortDesc } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const InteractiveDataExploration = () => {
  const { patientTestHistory, testResultsSummary, companyBenchmarks, isLoading } = useEnhancedAnalytics();
  
  // State for filters and controls
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTestTypes, setSelectedTestTypes] = useState<string[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [selectedFitnessStatus, setSelectedFitnessStatus] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [sortBy, setSortBy] = useState('examination_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selectedView, setSelectedView] = useState<'table' | 'chart' | 'summary'>('table');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // Process and filter data
  const filteredData = useMemo(() => {
    if (!patientTestHistory) return [];

    return patientTestHistory.filter(item => {
      const matchesSearch = !searchTerm || 
        item.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id_number?.includes(searchTerm);

      const matchesTestType = selectedTestTypes.length === 0 || 
        selectedTestTypes.includes(item.test_type || '');

      const matchesCompany = selectedCompanies.length === 0 || 
        selectedCompanies.includes(item.company_name || '');

      const matchesFitness = selectedFitnessStatus.length === 0 || 
        selectedFitnessStatus.includes(item.fitness_status || '');

      const matchesDateRange = (!dateRange.start || new Date(item.examination_date || '') >= new Date(dateRange.start)) &&
        (!dateRange.end || new Date(item.examination_date || '') <= new Date(dateRange.end));

      return matchesSearch && matchesTestType && matchesCompany && matchesFitness && matchesDateRange;
    });
  }, [patientTestHistory, searchTerm, selectedTestTypes, selectedCompanies, selectedFitnessStatus, dateRange]);

  // Sort filtered data
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let aValue = a[sortBy as keyof typeof a] || '';
      let bValue = b[sortBy as keyof typeof b] || '';

      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [filteredData, sortBy, sortOrder]);

  // Pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, rowsPerPage]);

  // Get unique values for filters
  const uniqueTestTypes = useMemo(() => 
    [...new Set(patientTestHistory?.map(item => item.test_type).filter(Boolean))],
    [patientTestHistory]
  );

  const uniqueCompanies = useMemo(() => 
    [...new Set(patientTestHistory?.map(item => item.company_name).filter(Boolean))],
    [patientTestHistory]
  );

  const uniqueFitnessStatus = useMemo(() => 
    [...new Set(patientTestHistory?.map(item => item.fitness_status).filter(Boolean))],
    [patientTestHistory]
  );

  // Summary statistics for filtered data
  const summaryStats = useMemo(() => {
    const total = filteredData.length;
    const fitCount = filteredData.filter(item => item.fitness_status === 'fit').length;
    const unfitCount = filteredData.filter(item => item.fitness_status === 'unfit').length;
    const expiredCount = filteredData.filter(item => item.expired).length;
    const expiringSoonCount = filteredData.filter(item => item.expiring_soon).length;

    return {
      total,
      fitCount,
      unfitCount,
      expiredCount,
      expiringSoonCount,
      fitnessRate: total > 0 ? ((fitCount / total) * 100).toFixed(1) : '0'
    };
  }, [filteredData]);

  // Chart data for selected records
  const chartData = useMemo(() => {
    const testTypeCounts = filteredData.reduce((acc, item) => {
      const testType = item.test_type || 'Unknown';
      acc[testType] = (acc[testType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(testTypeCounts).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRows.length === paginatedData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(paginatedData.map(item => item.patient_id || ''));
    }
  };

  const exportSelectedData = () => {
    const dataToExport = selectedRows.length > 0 
      ? filteredData.filter(item => selectedRows.includes(item.patient_id || ''))
      : filteredData;

    const csvContent = [
      ['Patient Name', 'ID Number', 'Company', 'Job Title', 'Test Type', 'Examination Date', 'Fitness Status', 'Test Result'].join(','),
      ...dataToExport.map(item => [
        item.patient_name || '',
        item.id_number || '',
        item.company_name || '',
        item.job_title || '',
        item.test_type || '',
        item.examination_date || '',
        item.fitness_status || '',
        item.test_result || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health_data_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedTestTypes([]);
    setSelectedCompanies([]);
    setSelectedFitnessStatus([]);
    setDateRange({ start: '', end: '' });
    setCurrentPage(1);
    setSelectedRows([]);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="h-96 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Interactive Data Exploration</h2>
          <div className="flex items-center space-x-2">
            <Select value={selectedView} onValueChange={(value: 'table' | 'chart' | 'summary') => setSelectedView(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="table">Table View</SelectItem>
                <SelectItem value="chart">Chart View</SelectItem>
                <SelectItem value="summary">Summary View</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportSelectedData} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export ({selectedRows.length || filteredData.length})
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search patients, companies, jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={selectedTestTypes.join(',')} onValueChange={(value) => setSelectedTestTypes(value ? value.split(',') : [])}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Test Type" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueTestTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex space-x-2">
                <Input
                  type="date"
                  placeholder="Start Date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                />
                <Input
                  type="date"
                  placeholder="End Date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                />
              </div>

              <Button onClick={clearAllFilters} variant="outline">
                Clear Filters
              </Button>
            </div>

            {/* Active Filters */}
            {(selectedTestTypes.length > 0 || selectedCompanies.length > 0 || selectedFitnessStatus.length > 0 || searchTerm) && (
              <div className="flex flex-wrap gap-2 mt-4">
                {searchTerm && (
                  <Badge variant="secondary">
                    Search: {searchTerm}
                    <button className="ml-1" onClick={() => setSearchTerm('')}>×</button>
                  </Badge>
                )}
                {selectedTestTypes.map(type => (
                  <Badge key={type} variant="secondary">
                    Test: {type}
                    <button className="ml-1" onClick={() => setSelectedTestTypes(prev => prev.filter(t => t !== type))}>×</button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">{summaryStats.total}</div>
            <div className="text-sm text-gray-600">Total Records</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">{summaryStats.fitCount}</div>
            <div className="text-sm text-gray-600">Fit</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-red-600" />
            <div className="text-2xl font-bold">{summaryStats.unfitCount}</div>
            <div className="text-sm text-gray-600">Unfit</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-orange-600" />
            <div className="text-2xl font-bold">{summaryStats.expiredCount}</div>
            <div className="text-sm text-gray-600">Expired</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Building2 className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold">{summaryStats.fitnessRate}%</div>
            <div className="text-sm text-gray-600">Fitness Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      {selectedView === 'table' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Detailed Records ({filteredData.length} total)</span>
              <div className="flex items-center space-x-2">
                <Select value={rowsPerPage.toString()} onValueChange={(value) => setRowsPerPage(Number(value))}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Checkbox
                        checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('patient_name')} className="p-0 h-auto font-semibold">
                        Patient Name
                        {sortBy === 'patient_name' && (sortOrder === 'asc' ? <SortAsc className="ml-1 h-4 w-4" /> : <SortDesc className="ml-1 h-4 w-4" />)}
                      </Button>
                    </TableHead>
                    <TableHead>ID Number</TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('company_name')} className="p-0 h-auto font-semibold">
                        Company
                        {sortBy === 'company_name' && (sortOrder === 'asc' ? <SortAsc className="ml-1 h-4 w-4" /> : <SortDesc className="ml-1 h-4 w-4" />)}
                      </Button>
                    </TableHead>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Test Type</TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('examination_date')} className="p-0 h-auto font-semibold">
                        Date
                        {sortBy === 'examination_date' && (sortOrder === 'asc' ? <SortAsc className="ml-1 h-4 w-4" /> : <SortDesc className="ml-1 h-4 w-4" />)}
                      </Button>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((item, index) => (
                    <TableRow key={index} className={selectedRows.includes(item.patient_id || '') ? 'bg-blue-50' : ''}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRows.includes(item.patient_id || '')}
                          onCheckedChange={() => handleSelectRow(item.patient_id || '')}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{item.patient_name}</TableCell>
                      <TableCell>{item.id_number}</TableCell>
                      <TableCell>{item.company_name}</TableCell>
                      <TableCell>{item.job_title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.test_type}</Badge>
                      </TableCell>
                      <TableCell>{item.examination_date}</TableCell>
                      <TableCell>
                        <Badge className={
                          item.fitness_status === 'fit' ? 'bg-green-100 text-green-800' :
                          item.fitness_status === 'unfit' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {item.fitness_status}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.test_result}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>View History</DropdownMenuItem>
                            <DropdownMenuItem>Export Record</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length} results
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {Math.ceil(filteredData.length / rowsPerPage)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredData.length / rowsPerPage)))}
                  disabled={currentPage >= Math.ceil(filteredData.length / rowsPerPage)}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedView === 'chart' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fitness Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Fit', value: summaryStats.fitCount, color: '#10b981' },
                      { name: 'Unfit', value: summaryStats.unfitCount, color: '#ef4444' },
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {[
                      { name: 'Fit', value: summaryStats.fitCount, color: '#10b981' },
                      { name: 'Unfit', value: summaryStats.unfitCount, color: '#ef4444' },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default InteractiveDataExploration;
