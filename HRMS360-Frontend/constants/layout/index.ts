export interface menuType {
  title: string;
  path: string | null;
  icon?: string;

  children?: menuType[];
}

export const hrmsTenantMenu: menuType[] = [
  { icon: "DashboardReference", title: "Dashboard", path: "/" },
  {
    icon: "CollapseCategories",
    title: "Competency Bank",
    path: "/competency-bank",
    children: [
      {
        title: "All Competencies",
        path: "/competency-bank",
      },
      {
        title: "Assessment areas",
        path: "/competency-bank/assessment-areas",
      },
    ],
  },
  {
    icon: "Catalog",
    title: "Questionnaire",
    path: "/questions-bank",
  },
  {
    icon: "Events",
    title: "Employee Configuration",
    path: "/employee-configuration",
    children: [
      {
        title: "Add/Edit Employees",
        path: "/employee-configuration",
      },

      {
        title: "Departments",
        path: "/employee-configuration/departments",
      },
      {
        title: "Designations",
        path: "/employee-configuration/employee-designations",
      },
    ],
  },
  {
    icon: "ChatLaunch",
    title: "Survey",
    path: "/survey",
    children: [
      {
        title: "My Survey",
        path: "/survey",
      },
      // {
      //   title: "Approval Requests",
      //   path: "/survey/approval-requests",
      // },
      {
        title: "Pending Nominations",
        path: "/survey/my/nominate-respondents",
      },
      // {
      //   title: "Alternative Suggestion",
      //   path: "/survey/my/alternative-suggestion",
      // },
    ],
  },
  {
    icon: "Settings",
    title: "Settings",
    path: "/settings",
    children: [
      // {
      //   title: "Standard Responses",
      //   path: "/settings/standard-responses",
      // },

      {
        title: "Raters",
        path: "/settings/raters",
      },
    ],
  },
];

export const nbolHrmsTenantMenu: menuType[] = [
  { icon: "DashboardReference", title: "Dashboard", path: "/" },
  {
    icon: "CollapseCategories",
    title: "Competency Bank",
    path: "/competency-bank",
  },
  {
    icon: "Catalog",
    title: "Questionnaire",
    path: "/questions-bank",
  },
  {
    icon: "ChatLaunch",
    title: "Survey",
    path: "/survey",
  },
  {
    icon: "Settings",
    title: "Settings",
    path: "/settings",
    children: [
      // {
      //   title: "Standard Responses",
      //   path: "/settings/standard-responses",
      // },
      {
        title: "Raters",
        path: "/settings/raters",
      },
    ],
  },
];

export const adminMenu: menuType[] = [
  { icon: "DashboardReference", title: "Dashboard", path: "/admin/dashboard" },
  {
    icon: "CollapseCategories",
    title: "Competency Bank",
    path: "/competency-bank",
    children: [
      {
        title: "All Competencies",
        path: "/competency-bank",
      },
      {
        title: "Assessment areas",
        path: "/competency-bank/assessment-areas",
      },
    ],
  },
  {
    icon: "Events",
    title: "Tenant Configuration",
    path: "/admin/tenant-configration",
  },

  {
    icon: "Settings",
    title: "Settings",
    path: "/admin/settings",
    children: [
      {
        title: "Users",
        path: "/admin/settings/users",
      },

      {
        title: "Industry",
        path: "/admin/settings/industry",
      },
    ],
  },
];

export const employeeMenu: menuType[] = [
  {
    icon: "ChatLaunch",
    title: "My Survey",
    path: "/survey/my",
  },
  // {
  //   icon: "TaskComplete",
  //   title: "Approval Requests",
  //   path: "/survey/approval-requests",
  // },
  {
    icon: "Events",
    title: "Pending Nominations",
    path: "/survey/my/nominate-respondents",
  },
  // {
  //   icon: "ShareKnowledge",
  //   title: "Alternative Suggestion",
  //   path: "/survey/my/alternative-suggestion",
  // },
];

export const apsisAdminMenu: menuType[] = [
  {
    icon: "DashboardReference",
    title: "Dashboard",
    path: "/apsis-admin/dashboard",
  },
  {
    icon: "Events",
    title: "Tenant Configration",
    path: "/apsis-admin/tenant-configration",
  },
  {
    icon: "Events",
    title: "Channel Partner Configration",
    path: "/apsis-admin/channel-partner-configration",
  },
  {
    icon: "Events",
    title: "Report Configration",
    path: "/apsis-admin/reports",
    children: [
      { title: "Tenant Report", path: "/apsis-admin/reports/tenant-report" },
      {
        title: "Channel Partner Report",
        path: "/apsis-admin/reports/channel-partner-report",
      },
      { title: "Survey Report", path: "/apsis-admin/reports/survey-report" },
    ],
  },
  {
    icon: "Settings",
    title: "Settings",
    path: "/apsis-admin/settings",
    children: [
      {
        title: "Industry",
        path: "/apsis-admin/settings/industry",
      },
    ],
  },
];

export const logoPath = "/media/images/zunoks_logo.png";
