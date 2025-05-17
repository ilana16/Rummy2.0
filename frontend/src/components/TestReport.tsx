import React from 'react';
import styled from 'styled-components';

interface TestReportProps {
  testResults: {
    category: string;
    tests: Array<{
      name: string;
      status: 'pass' | 'fail' | 'pending';
      notes?: string;
    }>;
  }[];
}

const ReportContainer = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
`;

const CategorySection = styled.div`
  margin-bottom: 30px;
`;

const CategoryTitle = styled.h2`
  margin-top: 0;
  padding-bottom: 10px;
  border-bottom: 2px solid #f5f5f5;
`;

const TestTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.th`
  text-align: left;
  padding: 12px;
  background-color: #f5f5f5;
`;

const TableRow = styled.tr`
  border-bottom: 1px solid #f5f5f5;
  
  &:last-child {
    border-bottom: none;
  }
`;

const TableCell = styled.td`
  padding: 12px;
`;

const StatusBadge = styled.span<{ status: 'pass' | 'fail' | 'pending' }>`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  color: white;
  background-color: ${props => {
    switch(props.status) {
      case 'pass': return '#4caf50';
      case 'fail': return '#f44336';
      case 'pending': return '#ff9800';
      default: return '#9e9e9e';
    }
  }};
`;

const Notes = styled.div`
  font-size: 14px;
  color: #757575;
  margin-top: 5px;
`;

const SummarySection = styled.div`
  margin-top: 30px;
  padding-top: 20px;
  border-top: 2px solid #f5f5f5;
`;

const TestReport: React.FC<TestReportProps> = ({ testResults }) => {
  // Calculate summary statistics
  const totalTests = testResults.reduce((sum, category) => sum + category.tests.length, 0);
  const passedTests = testResults.reduce((sum, category) => 
    sum + category.tests.filter(test => test.status === 'pass').length, 0);
  const failedTests = testResults.reduce((sum, category) => 
    sum + category.tests.filter(test => test.status === 'fail').length, 0);
  const pendingTests = testResults.reduce((sum, category) => 
    sum + category.tests.filter(test => test.status === 'pending').length, 0);
  
  const passPercentage = Math.round((passedTests / totalTests) * 100);
  
  return (
    <ReportContainer>
      <h1>Test Report</h1>
      
      {testResults.map((category, index) => (
        <CategorySection key={index}>
          <CategoryTitle>{category.category}</CategoryTitle>
          <TestTable>
            <thead>
              <tr>
                <TableHeader>Test</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Notes</TableHeader>
              </tr>
            </thead>
            <tbody>
              {category.tests.map((test, testIndex) => (
                <TableRow key={testIndex}>
                  <TableCell>{test.name}</TableCell>
                  <TableCell>
                    <StatusBadge status={test.status}>
                      {test.status.toUpperCase()}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>
                    {test.notes && <Notes>{test.notes}</Notes>}
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </TestTable>
        </CategorySection>
      ))}
      
      <SummarySection>
        <h2>Summary</h2>
        <p>
          <strong>Total Tests:</strong> {totalTests}<br />
          <strong>Passed:</strong> {passedTests} ({passPercentage}%)<br />
          <strong>Failed:</strong> {failedTests}<br />
          <strong>Pending:</strong> {pendingTests}
        </p>
      </SummarySection>
    </ReportContainer>
  );
};

export default TestReport;
