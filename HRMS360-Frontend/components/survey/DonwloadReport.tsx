import { Download } from "@carbon/icons-react";
import { useDownaloadFile } from "hooks/useDownloadFile";
import { Button } from "..";

export const DonwloadReport = ({ id }: { id: string }) => {
  const { isLoading, refetch, isRefetching } = useDownaloadFile(
    `/reports/download-report/${id}`
  );

  return (
    <div>
      <Button
        onClick={() => refetch()}
        isLoading={isLoading || isRefetching}
        variant={`text`}
        startIcon={<Download />}
      >
        Download Report
      </Button>
    </div>
  );
};
