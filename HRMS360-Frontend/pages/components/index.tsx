import { ColumnDelete, DotMark } from "@carbon/icons-react";
import { Grid, MenuItem, Typography } from "@mui/material";
import {
  Button,
  ButtonGroup,
  Confirm,
  DataGrid,
  Dialog,
  PageHeader,
  Input,
  ActionCard,
  AutoComplete,
  Checkbox,
  Chip,
  RadioGroup,
  Stepper,
  Select,
  PrimaryAccordion,
  SecondaryAccordion,
  Transferlist,
  Tabs,
} from "components";
import { Alert } from "components/layout/alert";
import { colors } from "constants/theme";
import { NextPage } from "next";
import { toast } from "utils/toaster";

const columns = [
  {
    headerName: "First Name",
    field: "first_name",
    width: 200,
    flex: 1,
  },
  {
    headerName: "Last Name",
    field: "last_name",
    width: 200,
    flex: 1,
  },
  {
    headerName: "Mobile Number",
    field: "mobile",
    width: 200,
    flex: 1,
  },
  {
    headerName: "Email",
    field: "email",
    width: 200,
    flex: 1,
  },
  {
    headerName: "Created At",
    field: "created_at",
    width: 200,
    flex: 1,
  },
];

const data = [
  {
    id: 1,
    first_name: "First Name",
    last_name: "Last Name",
    mobile: "1234567890",
    email: "email@email.com",
    created_at: "05/10/2022",
  },
  {
    id: 2,
    first_name: "First Name",
    last_name: "Last Name",
    mobile: "1234567890",
    email: "email@email.com",
    created_at: "05/10/2022",
  },
  {
    id: 3,
    first_name: "First Name",
    last_name: "Last Name",
    mobile: "1234567890",
    email: "email@email.com",
    created_at: "05/10/2022",
  },
  {
    id: 4,
    first_name: "First Name",
    last_name: "Last Name",
    mobile: "1234567890",
    email: "email@email.com",
    created_at: "05/10/2022",
  },
  {
    id: 5,
    first_name: "First Name",
    last_name: "Last Name",
    mobile: "1234567890",
    email: "email@email.com",
    created_at: "05/10/2022",
  },
  {
    id: 6,
    first_name: "First Name",
    last_name: "Last Name",
    mobile: "1234567890",
    email: "email@email.com",
    created_at: "05/10/2022",
  },
  {
    id: 7,
    first_name: "First Name",
    last_name: "Last Name",
    mobile: "1234567890",
    email: "email@email.com",
    created_at: "05/10/2022",
  },
  {
    id: 8,
    first_name: "First Name",
    last_name: "Last Name",
    mobile: "1234567890",
    email: "email@email.com",
    created_at: "05/10/2022",
  },
  {
    id: 9,
    first_name: "First Name",
    last_name: "Last Name",
    mobile: "1234567890",
    email: "email@email.com",
    created_at: "05/10/2022",
  },
  {
    id: 10,
    first_name: "First Name",
    last_name: "Last Name",
    mobile: "1234567890",
    email: "email@email.com",
    created_at: "05/10/2022",
  },
];
const Components: NextPage = () => {
  return (
    <>
      <PageHeader title='All Components' />
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography className='text-base border-black border-b'>
            Action Card
          </Typography>
        </Grid>
        <Grid
          item
          container
          xs={12}
          className='flex justify-start items-center'
        >
          <ActionCard className='mr-5' variant='primary'>
            Primary
          </ActionCard>
          <ActionCard className='mr-5' variant='secondary'>
            Secondary
          </ActionCard>
          <ActionCard className='mr-5' variant='tertiary'>
            Tertiary
          </ActionCard>
        </Grid>

        <Grid item xs={12}>
          <Typography className='text-base border-black border-b'>
            Data Grid
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <DataGrid columns={columns} rows={data} />
        </Grid>
        <Grid item xs={12}>
          <Typography className='text-base border-black border-b'>
            Buttons
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Button
            variant='contained'
            className='mr-2 capitalize'
            onClick={() => toast("Toast")}
          >
            Button contained
          </Button>
          <Button variant='outlined' className='mr-2 capitalize'>
            Button outlined
          </Button>
          <Button
            color='secondary'
            variant='contained'
            className='mr-2 capitalize'
          >
            Button contained
          </Button>
          <Button
            color='secondary'
            variant='outlined'
            className='mr-2 capitalize'
          >
            Button outlined
          </Button>
          <Button isLoading variant='contained' className='mr-2 capitalize'>
            Button Loading
          </Button>
          <Button disabled variant='contained'>
            Button Disabled
          </Button>
        </Grid>
        <Grid item xs={12}>
          <Typography className='text-base border-black border-b'>
            Button Group
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <ButtonGroup
            buttons={[
              { text: "Button One", key: "one" },
              { text: "Button two", key: "two" },
            ]}
          >
            <h1 className='text-center' key='one'>
              Component 1
            </h1>
            <h1 className='text-center' key='two'>
              Component 2
            </h1>
          </ButtonGroup>
        </Grid>
        <Grid item xs={12}>
          <Typography className='text-base border-black border-b'>
            Stepper
          </Typography>
        </Grid>
        <Grid item xs={8} className='p-10 mx-auto'>
          <Stepper
            activeStep={1}
            steps={[
              {
                position: 1,
                step: 1,
                component: (
                  <Typography className='text-base border-black border-b'>
                    Inside 1
                  </Typography>
                ),
              },
              {
                position: 2,
                step: 2,
                component: (
                  <Typography className='text-base border-black border-b'>
                    Inside 2
                  </Typography>
                ),
              },
            ]}
          />
        </Grid>
        <Grid item xs={12}>
          <Typography className='text-base border-black border-b'>
            Dialog Box
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Dialog button={<Button>Click to Open</Button>} title='Sample Dialog'>
            hello there
          </Dialog>
          <Confirm
            button={
              <Button
                variant='outlined'
                color='secondary'
                className='ml-2'
                startIcon={<ColumnDelete color='inherit' />}
              >
                Confirm
              </Button>
            }
            submitHandler={(onClose) => onClose()}
            title='Sample Dialog'
          >
            Are You sure do you want to see confirm dailoge
          </Confirm>
        </Grid>

        <Grid item xs={12}>
          <Typography className='text-base border-black border-b'>
            Primary Accordion
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <PrimaryAccordion
            header={`Q 1.  Derives self and team to understand customer’s current and future requirements and delivers within customers timelines . `}
          >
            <Grid container>
              <Grid item xs={12}>
                <Chip className='mx-2' label='one' />
                <Chip className='mx-2' label='one' />
                <Chip className='mx-2' label='one' />
                <Chip className='mx-2' label='one' />
                <Chip className='mx-2' label='one' />
                <Chip className='mx-2' label='one' />
                <Chip className='mx-2' label='one' />
              </Grid>
            </Grid>
          </PrimaryAccordion>
          <PrimaryAccordion
            header={`Q 1.  Derives self and team to understand customer’s current and future requirements and delivers within customers timelines . `}
          >
            <Grid container>
              <Grid item xs={12}>
                <Chip className='mx-2' label='one' />
                <Chip className='mx-2' label='one' />
                <Chip className='mx-2' label='one' />
                <Chip className='mx-2' label='one' />
                <Chip className='mx-2' label='one' />
                <Chip className='mx-2' label='one' />
                <Chip className='mx-2' label='one' />
              </Grid>
            </Grid>
          </PrimaryAccordion>
        </Grid>

        <Grid item xs={12}>
          <Typography className='text-base border-black border-b'>
            Secondary Accordion
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <SecondaryAccordion
            header={`Line Manager`}
            status={
              <>
                <DotMark fill={colors.primary.dark} className='mr-2' /> Already
                Nominated by HR
              </>
            }
          >
            <Grid container>
              <Grid item xs={12}>
                <Chip className='mx-2' label='one' />
                <Chip className='mx-2' label='one' />
                <Chip className='mx-2' label='one' />
                <Chip className='mx-2' label='one' />
                <Chip className='mx-2' label='one' />
                <Chip className='mx-2' label='one' />
                <Chip className='mx-2' label='one' />
              </Grid>
            </Grid>
          </SecondaryAccordion>
          <SecondaryAccordion
            header={`Secondary Line Manager`}
            status={
              <>
                <DotMark fill={colors.secondary.dark} className='mr-2' />{" "}
                Required : 03 | Nominated: 02
              </>
            }
          >
            <Grid container>
              <Grid item xs={12}>
                <Chip className='mx-2' label='one' />
                <Chip className='mx-2' label='one' />
                <Chip className='mx-2' label='one' />
                <Chip className='mx-2' label='one' />
                <Chip className='mx-2' label='one' />
                <Chip className='mx-2' label='one' />
                <Chip className='mx-2' label='one' />
              </Grid>
            </Grid>
          </SecondaryAccordion>
        </Grid>
        <Grid item xs={12}>
          <Typography className='text-base border-black border-b'>
            Chips
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Chip className='mx-2' label='one' />
          <Chip className='mx-2' label='one' />
          <Chip className='mx-2' label='one' />
          <Chip className='mx-2' label='one' />
          <Chip className='mx-2' label='one' />
          <Chip className='mx-2' label='one' />
          <Chip className='mx-2' label='one' />
        </Grid>
        <Grid item xs={12}>
          <Typography className='text-base border-black border-b'>
            Inputs
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Input label='Besic input' />
        </Grid>

        <Grid item xs={6}>
          <AutoComplete label='Select' options={["one", "two", "three"]} />
        </Grid>
        <Grid item xs={6}>
          <AutoComplete
            label='Multipe Select'
            multiple
            options={["one", "two", "three"]}
          />
        </Grid>
        <Grid item xs={6}>
          <Input label='Text Area' multiline rows={3} />
        </Grid>
        <Grid item xs={4} className='flex items-end'>
          <Checkbox label='Checkbox' />
        </Grid>
        <Grid item xs={4} className='px-5'>
          <RadioGroup
            label='Radio Buttons'
            row
            options={[
              { value: "one", label: "One" },
              { value: "two", label: "two" },
              { value: "three", label: "Three" },
              { value: "four", label: "Four" },
            ]}
          />
        </Grid>
        <Grid item xs={4} className='flex items-end flex-col justify-start'>
          <Typography className='mr-2'>Small Select</Typography>
          <Select border={true}>
            <MenuItem value='one'>One</MenuItem>
            <MenuItem value='two'>Two</MenuItem>
            <MenuItem value='three'>Three</MenuItem>
            <MenuItem value='four'>Four</MenuItem>
          </Select>
        </Grid>
        <Grid item xs={12}>
          <Typography className='text-base border-black border-b'>
            Transferlist
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Transferlist header='Available Employees'>
            <Tabs
              tabs={[
                {
                  id: 0,
                  buttonLabel: "By Department",
                  component: <h6>By Department</h6>,
                },
                {
                  id: 1,
                  buttonLabel: "By Designation",
                  component: <h6>By Designation</h6>,
                },
                {
                  id: 2,
                  buttonLabel: "By Employee Name",
                  component: <h6>By Employee Name</h6>,
                },
              ]}
            />
          </Transferlist>
        </Grid>
        <Grid item xs={12}>
          <Alert text='Some text' variant='success' />
        </Grid>
      </Grid>
    </>
  );
};

export default Components;
