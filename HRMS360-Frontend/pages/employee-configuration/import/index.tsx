import { Grid } from "@mui/material";
import {
  AssignLineManager,
  DownloadSampleFile,
  UploadSampleFile,
} from "components/employee-config";
import { PageHeader, Stepper } from "components/layout";
import { NextPage } from "next";
import { useState } from "react";

export interface ImportProps {
  goBack: VoidFunction;
  setActiveStep?: any;
  setUsers: any;
}

const ImportEmployee: NextPage = () => {
  const [activeStep, setActiveStep] = useState(0);

  const [users, setUsers] = useState([]);

  const goBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  return (
    <>
      <PageHeader title="Import Data" />
      <Grid container>
        <Stepper
          activeStep={activeStep}
          steps={[
            {
              position: 0,
              step: "Download Sample file",
              component: <DownloadSampleFile setActiveStep={0} />,
            },
            {
              position: 1,
              step: "Upload Excel file",
              component: (
                <UploadSampleFile
                  setUsers={setUsers}
                  goBack={goBack}
                  setActiveStep={1}
                />
              ),
            },

            {
              position: 2,
              step: "Assign Line Manager",
              component: <AssignLineManager users={users} setActiveStep={2} />,
            },
          ]}
        />
      </Grid>
    </>
  );
};

export default ImportEmployee;
