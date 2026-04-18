import { createTheme } from '@mui/material/styles';

const serif = "'Instrument Serif', 'Source Serif Pro', Georgia, serif";
const sans  = "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif";
const mono  = "'JetBrains Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace";

const bg        = '#f2ebe0';
const bg2       = '#eae0d0';
const bg3       = '#e0d3bd';
const paper     = '#f7f1e6';
const ink       = '#2b2118';
const inkSoft   = '#4a3e32';
const muted     = '#8a7862';
const line      = '#d6c6ae';
const lineSoft  = '#e2d5be';
const terracotta     = '#b85c3c';
const terracottaDark = '#8f4529';
const ochre     = '#c8893b';
const success   = '#5e7a3e';
const error     = '#9a2820';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary:   { main: ink, light: inkSoft, dark: '#1a130c', contrastText: paper },
    secondary: { main: terracotta, light: '#d17354', dark: terracottaDark, contrastText: paper },
    background:{ default: bg, paper },
    text:      { primary: ink, secondary: inkSoft, disabled: muted },
    divider:   line,
    success:   { main: success, contrastText: paper },
    warning:   { main: ochre,   contrastText: paper },
    error:     { main: error,   contrastText: paper },
  },
  typography: {
    fontFamily: sans,
    h1: { fontFamily: serif, fontWeight: 400, letterSpacing: '-0.035em', lineHeight: 0.95 },
    h2: { fontFamily: serif, fontWeight: 400, letterSpacing: '-0.025em', lineHeight: 1 },
    h3: { fontFamily: serif, fontWeight: 400, letterSpacing: '-0.02em',  lineHeight: 1.05 },
    h4: { fontFamily: serif, fontWeight: 400, letterSpacing: '-0.015em', lineHeight: 1.1 },
    h5: { fontFamily: sans,  fontWeight: 500, letterSpacing: '-0.005em' },
    h6: { fontFamily: sans,  fontWeight: 500, letterSpacing: 0 },
    body1: { fontFamily: sans, lineHeight: 1.55 },
    body2: { fontFamily: sans, lineHeight: 1.5 },
    button: { fontWeight: 500, letterSpacing: 0, textTransform: 'none' },
    overline: {
      fontFamily: mono,
      fontWeight: 500,
      letterSpacing: '0.12em',
      fontSize: '11px',
      textTransform: 'uppercase',
      lineHeight: 1,
    },
    caption: { fontFamily: mono, fontSize: '11px', letterSpacing: '0.05em' },
  },
  shape: { borderRadius: 2 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: bg, color: ink },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '14px',
          letterSpacing: 0,
          padding: '12px 20px',
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
          '&:active': { transform: 'translateY(1px)' },
        },
        sizeLarge: { padding: '14px 22px', fontSize: '14px' },
        sizeSmall: { padding: '8px 14px',  fontSize: '13px' },
        containedPrimary: {
          background: ink,
          color: paper,
          '&:hover': { background: terracottaDark },
          '&.Mui-disabled': { background: 'rgba(43,33,24,0.12)', color: 'rgba(43,33,24,0.4)' },
        },
        containedSecondary: {
          background: terracotta,
          color: paper,
          '&:hover': { background: terracottaDark },
        },
        containedError: {
          background: error, color: paper,
          '&:hover': { background: '#7a1e18' },
        },
        outlined: {
          border: `1px solid ${ink}`,
          color: ink,
          padding: '11px 19px',
          '&:hover': { background: ink, color: paper, borderColor: ink },
        },
        outlinedPrimary: {
          border: `1px solid ${ink}`,
          color: ink,
          '&:hover': { background: ink, color: paper, borderColor: ink },
        },
        outlinedError: {
          border: `1px solid ${error}`,
          color: error,
          '&:hover': { background: error, color: paper, borderColor: error },
        },
        text: {
          color: ink,
          '&:hover': { background: bg2 },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: '50%',
          color: ink,
          width: 40,
          height: 40,
          '&:hover': { background: bg2 },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: paper,
          border: `1px solid ${line}`,
          borderRadius: 4,
          backgroundImage: 'none',
          boxShadow: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: 'none',
          borderRadius: 4,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'transparent',
          boxShadow: 'none',
          borderRadius: 0,
          color: ink,
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            background: 'transparent',
            fontFamily: sans,
            '& fieldset': { borderColor: line },
            '&:hover fieldset': { borderColor: inkSoft },
            '&.Mui-focused fieldset': { borderColor: ink, borderWidth: 1 },
          },
          '& .MuiInputLabel-root': {
            color: muted,
            fontFamily: sans,
            '&.Mui-focused': { color: ink },
          },
          '& .MuiFormHelperText-root': {
            fontFamily: mono,
            fontSize: '10px',
            letterSpacing: '0.05em',
            color: muted,
            marginLeft: 2,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          fontFamily: mono,
          fontSize: '10px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          fontWeight: 500,
          height: 24,
          background: 'transparent',
          border: `1px solid ${line}`,
          color: ink,
        },
        colorPrimary: { background: ink, color: paper, borderColor: ink },
        colorSecondary: { background: terracotta, color: paper, borderColor: terracotta },
        colorSuccess: { background: 'rgba(94,122,62,0.12)', color: success, borderColor: 'transparent' },
        colorWarning: { background: 'rgba(200,137,59,0.15)', color: '#7A5420', borderColor: 'transparent' },
        colorError:   { background: 'rgba(154,40,32,0.1)',  color: error,     borderColor: 'transparent' },
        outlined: { background: 'transparent' },
        label: { paddingLeft: 10, paddingRight: 10 },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: line },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { backgroundColor: bg, backgroundImage: 'none', borderRadius: 0 },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 4,
          border: `1px solid ${line}`,
          backgroundColor: paper,
          backgroundImage: 'none',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 2,
          border: `1px solid ${line}`,
          backgroundColor: paper,
          boxShadow: 'none',
          marginTop: 4,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontFamily: sans,
          fontSize: '14px',
          '&:hover': { background: bg2 },
          '&.Mui-selected': { background: 'rgba(184,92,60,0.1)' },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { height: 2, backgroundColor: terracotta },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontFamily: mono,
          fontSize: '11px',
          letterSpacing: '0.12em',
          fontWeight: 500,
          minHeight: 48,
          padding: '12px 0',
          marginRight: 32,
          color: muted,
          '&.Mui-selected': { color: ink },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${lineSoft}`,
          fontFamily: sans,
          fontSize: '14px',
          padding: '14px 12px',
        },
        head: {
          fontFamily: mono,
          fontSize: '11px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: muted,
          fontWeight: 500,
          borderBottom: `1px solid ${line}`,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          border: '1px solid',
          fontFamily: sans,
        },
        standardError:   { background: 'rgba(154,40,32,0.06)',  color: error,   borderColor: 'rgba(154,40,32,0.3)' },
        standardSuccess: { background: 'rgba(94,122,62,0.08)',  color: success, borderColor: 'rgba(94,122,62,0.3)' },
        standardInfo:    { background: 'rgba(184,92,60,0.06)',  color: terracotta, borderColor: 'rgba(184,92,60,0.25)' },
        standardWarning: { background: 'rgba(200,137,59,0.1)',  color: '#7A5420',  borderColor: 'rgba(200,137,59,0.35)' },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: {
          borderRadius: 9,
          background: terracotta,
          color: paper,
          fontFamily: mono,
          fontSize: '10px',
          fontWeight: 600,
          minWidth: 18,
          height: 18,
          padding: '0 5px',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${terracotta}, ${ochre})`,
          color: paper,
          fontFamily: serif,
          fontWeight: 400,
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: { backgroundColor: 'rgba(43,33,24,0.08)', borderRadius: 2 },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { backgroundColor: bg3, borderRadius: 3, height: 6 },
        bar: { backgroundColor: terracotta, borderRadius: 3 },
      },
    },
  },
});

export default theme;
