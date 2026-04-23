// Primary navigation links per role (Messages & Notifications are icon-buttons in the Navbar)
export const NAV_LINKS_BY_ROLE = {
  GUEST: [
    { to: '/jobs', label: 'Browse Jobs' },
  ],
  CANDIDATE: [
    { to: '/jobs',         label: 'Jobs'         },
    { to: '/saved-jobs',   label: 'Saved'        },
    { to: '/applications', label: 'Applications' },
    { to: '/interviews',   label: 'Interviews'   },
    { to: '/profile',      label: 'Profile'      },
  ],
  RECRUITER: [
    { to: '/recruiter/dashboard',    label: 'Dashboard'    },
    { to: '/recruiter/jobs',         label: 'Jobs'         },
    { to: '/recruiter/applications', label: 'Applications' },
    { to: '/recruiter/interviews',   label: 'Interviews'   },
    { to: '/recruiter/analytics',    label: 'Analytics'    },
    { to: '/recruiter/subscription', label: 'Billing'      },
  ],
  ADMIN: [
    { to: '/admin/dashboard', label: 'Dashboard'   },
    { to: '/jobs',            label: 'Marketplace' },
  ],
};

export const HOME_PATH_BY_ROLE = {
  CANDIDATE: '/jobs',
  RECRUITER: '/recruiter/dashboard',
  ADMIN: '/admin/dashboard',
};
