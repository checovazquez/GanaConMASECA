/* =============================================================================
   stores-catalog.js — Catálogo único de tiendas (compartido entre app y admin)
   ============================================================================= */

const STORES = [
  // ── Chedraui ────────────────────────────────────────────────────────────
  { label: '232 | CHEDRAUI | CHESELECTO POLANCO',                    email: 'tienda232@maseca.com' },
  { label: '234 | CHEDRAUI | CHEDRAUI AJUSCO',                       email: 'tienda234@maseca.com' },
  { label: '237 | CHEDRAUI | CHEDRAUI TENAYUCA',                     email: 'tienda237@maseca.com' },
  { label: '262 | CHEDRAUI | SELECTO PLAZA MEXICO',                  email: 'tienda262@maseca.com' },
  { label: '249 | CHEDRAUI | CHESELECTO GDL ACUEDUCTO',              email: 'tienda249@maseca.com' },

  // ── HEB ─────────────────────────────────────────────────────────────────
  { label: '2920 | HEB | MI TIENDA HEB ZUAZUA',                      email: 'tienda2920@maseca.com' },
  { label: '2921 | HEB | MI TIENDA GARCIA',                          email: 'tienda2921@maseca.com' },
  { label: '9104 | HEB | MT BUENAVISTA',                             email: 'tienda9104@maseca.com' },
  { label: '2990 | HEB | MI TIENDA HEB CIUDADELA',                   email: 'tienda2990@maseca.com' },
  { label: '2925 | HEB | MI TIENDA PLAZA DEL BOSQUE',                email: 'tienda2925@maseca.com' },
  { label: '2932 | HEB | MI TIENDA METROPLEX',                       email: 'tienda2932@maseca.com' },
  { label: '2917 | HEB | MT ELOY CAVAZOS',                           email: 'tienda2917@maseca.com' },
  { label: '2994 | HEB | HEB MI TIENDA HUINALA',                     email: 'tienda2994@maseca.com' },
  { label: '2966 | HEB | MI TIENDA HEB SAN ROQUE',                   email: 'tienda2966@maseca.com' },
  { label: '2956 | HEB | MI TIENDA AZTLAN',                          email: 'tienda2956@maseca.com' },

  // ── Merco ────────────────────────────────────────────────────────────────
  { label: '0 | Merco | MERCO SOLIDARIDAD',                          email: 'mercomercosolidaridad@maseca.com' },
  { label: '0 | Merco | MERCO PLAZA SENDERO',                        email: 'mercomercoplazasendero@maseca.com' },
  { label: '0 | Merco | MERCO LINDA VISTA',                          email: 'mercomercolindavista@maseca.com' },
  { label: '0 | Merco | MERCO GARCIA',                               email: 'mercomercogarcia@maseca.com' },
  { label: '0 | Merco | MERCO BUENAVISTA',                           email: 'mercomercobuenavista@maseca.com' },

  // ── Mi Tienda ────────────────────────────────────────────────────────────
  { label: '0 | Mi Tienda | MARGARITAS',                             email: 'mitiendamargaritas@maseca.com' },
  { label: '0 | Mi Tienda | CABEZADA',                               email: 'mitiendacabezada@maseca.com' },
  { label: '0 | Mi Tienda | ANZURES',                                email: 'mitiendaanzures@maseca.com' },
  { label: '0 | Mi Tienda | SANTA MARIA',                            email: 'mitiendasantamaria@maseca.com' },

  // ── Smart ────────────────────────────────────────────────────────────────
  { label: '94 | Smart | SANTO DOMINGO',                             email: 'tienda94@maseca.com' },
  { label: '97 | Smart | CUMBRES',                                   email: 'tienda97@maseca.com' },
  { label: '105 | Smart | EL MOLINETE',                              email: 'tienda105@maseca.com' },
  { label: '107 | Smart | LAS MARGARITAS',                           email: 'tienda107@maseca.com' },
  { label: '108 | Smart | SANTA CATARINA',                           email: 'tienda108@maseca.com' },
  { label: '91 | Smart | SOLIDARIDAD',                               email: 'tienda91@maseca.com' },

  // ── Soriana ──────────────────────────────────────────────────────────────
  { label: '27 | SORIANA | SORIANA SUC STA. MARIA',                  email: 'tienda27@maseca.com' },
  { label: '92 | SORIANA | SORIANA SOLIDARIDAD',                     email: 'tienda92@maseca.com' },
  { label: '53 | SORIANA | SORIANA LAS TORRES',                      email: 'tienda53@maseca.com' },
  { label: '360 | SORIANA | MDO SORIANA AZTLAN SUC',                 email: 'tienda360@maseca.com' },
  { label: '132 | SORIANA | SORIANA TOPO CHICO',                     email: 'tienda132@maseca.com' },
  { label: '7 | SORIANA | SORIANA SUC CONTRY 7',                     email: 'tienda7@maseca.com' },
  { label: '88 | SORIANA | SORIANA LAS QUINTAS',                     email: 'tienda88@maseca.com' },
  { label: '24 | SORIANA | SORIANA SUC CUMBRES',                     email: 'tienda24@maseca.com' },
  { label: '203 | SORIANA | SORIANA SUCURSAL SAN ROQUE',             email: 'tienda203@maseca.com' },
  { label: '66 | SORIANA | SORIANA ESTANZUELA',                      email: 'tienda66@maseca.com' },
  { label: '896 | SORIANA | MDO SOR CUAUTEPEC',                      email: 'tienda896@maseca.com' },
  { label: '426 | SORIANA | MDO. SORIANA SUC. PEÑON',                email: 'tienda426@maseca.com' },
  { label: '0 | SORIANA | MDO SORIANA VILLA NICOLAS ROMERO',         email: 'sorianavillanicolasromero@maseca.com' },
  { label: '902 | SORIANA | MDO SOR XOCHIMILCO',                     email: 'tienda902@maseca.com' },
  { label: '227 | SORIANA | SORIANA SUC ERMITA',                     email: 'tienda227@maseca.com' },
  { label: '300 | SORIANA | SORIANA SUC. MIRAMONTES',                email: 'tienda300@maseca.com' },
  { label: '0 | SORIANA | SORIANA EXPRES PLAZA CUAUTITLAN',          email: 'sorianaexpresplazacuautitlan@maseca.com' },
  { label: '447 | SORIANA | MDO SORIANA TLAHUAC SUC',                email: 'tienda447@maseca.com' },
  { label: '946 | SORIANA | MOD SOR IZTAPALAPA',                     email: 'tienda946@maseca.com' },
  { label: '885 | SORIANA | MDO SOR CUAUTITLAN',                     email: 'tienda885@maseca.com' },
  { label: '930 | SORIANA | MEGA SORIANA SUC IZCALLI',               email: 'tienda930@maseca.com' },
  { label: '857 | SORIANA | MEGA SORIANA SUC MIXCOAC',               email: 'tienda857@maseca.com' },
  { label: '898 | SORIANA | MEGA SORIANA V DE LA HACIENDA',          email: 'tienda898@maseca.com' },
  { label: '400 | SORIANA | SORIANA G SUC TULTEPEC',                 email: 'tienda400@maseca.com' },
  { label: '998 | SORIANA | MEGA SORIANA SUC LA VILLA',              email: 'tienda998@maseca.com' },

  // ── SUMERCA ──────────────────────────────────────────────────────────────
  { label: '0 | SUMERCA | VILLAS',                                   email: 'sumercavillas@maseca.com' },
  { label: '0 | SUMERCA | SOLIDARIDAD',                              email: 'sumercasolidaridad@maseca.com' },
  { label: '0 | SUMERCA | PEDRERAS',                                 email: 'sumercapedreras@maseca.com' },
  { label: '0 | SUMERCA | VALLE DEL ROBLE',                          email: 'sumercavalledelroble@maseca.com' },
  { label: '0 | SUMERCA | VALLE DEL ROBLE OLMOS',                    email: 'sumercavalledelrobleolmos@maseca.com' },
  { label: '0 | SUMERCA | LINCOLN',                                  email: 'sumercalincoln@maseca.com' },

  // ── Walmart ──────────────────────────────────────────────────────────────
  { label: '3623 | Walmart | BA LOS FRESNOS',                        email: 'tienda3623@maseca.com' },
  { label: '3625 | Walmart | SORIANA HIPER DIEGO DIAZ',              email: 'tienda3625@maseca.com' },
  { label: '3443 | Walmart | BA CLOUTHIER',                          email: 'tienda3443@maseca.com' },
  { label: '5712 | Walmart | BA SOLIDARIDAD',                        email: 'tienda5712@maseca.com' },
  { label: '3298 | Walmart | BA ESCOBEDO MTY',                       email: 'tienda3298@maseca.com' },
  { label: '2097 | Walmart | BA PUEBLO NUEVO',                       email: 'tienda2097@maseca.com' },
  { label: '3362 | Walmart | BA TOPOCHICO',                          email: 'tienda3362@maseca.com' },
  { label: '3801 | Walmart | BA STO. DOMINGO NVO. LEON',             email: 'tienda3801@maseca.com' },
  { label: '3765 | Walmart | BA ECATEPEC',                           email: 'tienda3765@maseca.com' },
  { label: '3756 | Walmart | BA TLALNEPANTLA',                       email: 'tienda3756@maseca.com' },
  { label: '3892 | Walmart | BA PLAZA ARAGON',                       email: 'tienda3892@maseca.com' },
  { label: '3141 | Walmart | BA SAN PABLO TULTITLAN',                email: 'tienda3141@maseca.com' },
  { label: '3679 | Walmart | SORIANA SUC ATIZAPAN',                  email: 'tienda3679@maseca.com' },
  { label: '3294 | Walmart | SORIANA SUC IXTAPALUCA',                email: 'tienda3294@maseca.com' },
  { label: '3784 | Walmart | BA RIO HONDO',                          email: 'tienda3784@maseca.com' },
  { label: '3891 | Walmart | MDO SORIANA LA VIGA RECREO',            email: 'tienda3891@maseca.com' },
  { label: '3874 | Walmart | SORIANA G SUC PLAZA CANTIL',            email: 'tienda3874@maseca.com' },
  { label: '3763 | Walmart | BA MARIANO ESCOBEDO',                   email: 'tienda3763@maseca.com' },
  { label: '3759 | Walmart | BA SAN RAFAEL',                         email: 'tienda3759@maseca.com' },
  { label: '3845 | Walmart | SC UNIVERSIDAD',                        email: 'tienda3845@maseca.com' },
  { label: '3755 | Walmart | SORIANA SUC TACUBAYA',                  email: 'tienda3755@maseca.com' },
  { label: '3751 | Walmart | MEGA SORIANA SUC PILARES',              email: 'tienda3751@maseca.com' },
  { label: '3769 | Walmart | BA INSURGENTES NORTE',                  email: 'tienda3769@maseca.com' },
  { label: '3897 | Walmart | MEGA SORIANA SUC LA VIGA',              email: 'tienda3897@maseca.com' },
  { label: '3764 | Walmart | SORIANA G SUC IZTAPALAPA',              email: 'tienda3764@maseca.com' },
  { label: '2344 | Walmart | MEGA SORIANA SUC NAUCALPAN',            email: 'tienda2344@maseca.com' },
  { label: '3665 | Walmart | BA CANUTILLO',                          email: 'tienda3665@maseca.com' },
  { label: '5798 | Walmart | MDO. SORIANA SUC. AVIACION',            email: 'tienda5798@maseca.com' },
  { label: '3789 | Walmart | BA REVOLUCION',                         email: 'tienda3789@maseca.com' },
  { label: '3781 | Walmart | BA INDEPENDENCIA',                      email: 'tienda3781@maseca.com' },
  { label: '3780 | Walmart | SORIANA SUC. AMERICAS',                 email: 'tienda3780@maseca.com' },
  { label: '3557 | Walmart | BA CHULAVISTA',                         email: 'tienda3557@maseca.com' },
  { label: '1555 | Walmart | BA SOLIDARIDAD GUAD',                   email: 'tienda1555@maseca.com' },
  { label: '3866 | Walmart | BA ARBOLEDAS',                          email: 'tienda3866@maseca.com' },
  { label: '2028 | Walmart | MDO. SORIANA SUC. SANTA FE',            email: 'tienda2028@maseca.com' },
  { label: '2135 | Walmart | BA CLINICA UNION DEL CUAT',             email: 'tienda2135@maseca.com' },
];

// Lookup rápido email → nombre completo de tienda
const STORE_NAME = Object.fromEntries(STORES.map(s => [s.email, s.label]));

// Helper: dado un email devuelve el label, o el email si no se encuentra
function storeName(email) {
  return STORE_NAME[email] || email;
}
