
import React, { useMemo, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  width: number;
  render?: (value: any, row: any) => React.ReactNode;
}

interface VirtualizedTableProps {
  data: any[];
  columns: Column[];
  height?: number;
  itemHeight?: number;
  searchable?: boolean;
  title?: string;
  pageSize?: number;
}

const VirtualizedTable: React.FC<VirtualizedTableProps> = ({
  data = [],
  columns,
  height = 400,
  itemHeight = 50,
  searchable = true,
  title,
  pageSize = 50
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(item =>
      Object.values(item).some(value =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  const paginatedData = useMemo(() => {
    const startIndex = currentPage * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = paginatedData[index];
    if (!item) return null;

    return (
      <div style={style} className="flex items-center border-b border-gray-100 hover:bg-gray-50">
        {columns.map((column, colIndex) => (
          <div
            key={column.key}
            className="px-4 py-2 flex-shrink-0 overflow-hidden text-ellipsis"
            style={{ width: column.width }}
          >
            {column.render ? column.render(item[column.key], item) : (
              <span className="text-sm">{item[column.key]}</span>
            )}
          </div>
        ))}
      </div>
    );
  };

  const HeaderRow = () => (
    <div className="flex items-center bg-gray-50 border-b border-gray-200 font-medium">
      {columns.map((column) => (
        <div
          key={column.key}
          className="px-4 py-3 flex-shrink-0 text-sm font-medium text-gray-700"
          style={{ width: column.width }}
        >
          {column.label}
        </div>
      ))}
    </div>
  );

  return (
    <Card>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-0">
        {searchable && (
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(0); // Reset to first page when searching
                }}
                className="pl-10"
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
              <span>
                Showing {paginatedData.length} of {filteredData.length} results
              </span>
              {totalPages > 1 && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage === totalPages - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="relative">
          <HeaderRow />
          {paginatedData.length > 0 ? (
            <List
              height={height}
              itemCount={paginatedData.length}
              itemSize={itemHeight}
              width="100%"
            >
              {Row}
            </List>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-500">
              No data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VirtualizedTable;
