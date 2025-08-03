"use client";

import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import { useRef, useState } from "react";
import dynamic from 'next/dynamic';
// Iconos y store
import { ChevronDown, Cpu, Puzzle, Shield, Boxes, ShoppingCart, Users, Truck, Calculator, Factory, Handshake, BarChart, Layers, ShieldCheck, Gift, Award, Package, Wrench, Calendar, Check, Info } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import AuthMenu from '@/components/AuthMenu';
const InfiniteScroller = dynamic(() => import('@/components/InfiniteScroller'), { ssr: false });
const ChatWidget = dynamic(() => import('@/components/ChatWidget'), { ssr: false });

const AccordionItem = ({
  i,
  expanded,
  setExpanded,
  question,
  answer,
}: {
  i: number;
  expanded: false | number;
  setExpanded: (i: number | false) => void;
  question: string;
  answer: string;
}) => {
  const isOpen = i === expanded;

  return (
    <div className="mb-2 backdrop-blur-sm bg-white/5 rounded-lg border border-white/10">
      <motion.header
        initial={false}
        animate={{ backgroundColor: isOpen ? "rgba(2, 132, 199, 0.3)" : "rgba(255, 255, 255, 0.05)" }}
        onClick={() => setExpanded(isOpen ? false : i)}
        className="cursor-pointer flex justify-between items-center p-4 rounded-t-lg"
      >
        <h5 className="text-lg font-medium text-slate-100">{question}</h5>
        <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
        >
            <ChevronDown className="text-slate-300" />
        </motion.div>
      </motion.header>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.section
            key="content"
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: { opacity: 1, height: "auto" },
              collapsed: { opacity: 0, height: 0 },
            }}
            transition={{ duration: 0.8, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="p-4 pt-0 text-slate-300"
          >
            {answer}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
};

const faqs = [
    {
        question: "¿Qué es CoreFoundry?",
        answer: "CoreFoundry es un ERP modular construido con tecnologías modernas, diseñado para ser flexible, escalable y fácil de extender."
    },
    {
        question: "¿Qué tecnologías clave utiliza?",
        answer: "CoreFoundry se construye sobre Next.js para la aplicación, Zustand para el manejo de estado, TanStack Query para la gestión de datos, MongoDB como base de datos NoSQL y Auth.js (NextAuth.js v5) para una autenticación segura y escalable."
    },
    {
        question: "¿Cómo funciona la modularidad?",
        answer: "La plataforma está diseñada para ser extremadamente modular. Cada funcionalidad, como Inventario o Ventas, puede ser un módulo independiente que se conecta al Módulo Central. Esto permite un desarrollo flexible y desacoplado."
    },
    {
        question: "¿Qué gestiona el Módulo Central?",
        answer: "El Módulo Central es el corazón de CoreFoundry. Gestiona la autenticación de usuarios, roles, permisos, suscripciones a planes y qué módulos están habilitados para cada cuenta. También asegura las conexiones y flujos de datos entre los distintos módulos."
    }
];


export default function Home() {
  const [expanded, setExpanded] = useState<false | number>(false);
  const [billingCycle, setBillingCycle] = useState<'monthly'|'annual'>('monthly');
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -64; // navbar height offset
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "-20%"]);

  const features = [
      {
          title: "Módulo Central",
          description: "Orquesta usuarios, módulos y conexiones para garantizar la seguridad y trazabilidad de los datos.",
          icon: Cpu
      },
      {
          title: "Modularidad Extrema",
          description: "Cada módulo puede tener su propio esquema y lógica, permitiendo un desarrollo independiente y flexible.",
          icon: Puzzle
      },
      {
          title: "Conexiones Seguras",
          description: "Flujos de datos validados entre módulos, con seguridad robusta y auditoría de acciones.",
          icon: Shield
      }
  ]

        const modules = [
         { title: "Inventario", icon: Boxes },
         { title: "Punto de Venta (POS)", icon: ShoppingCart },
         { title: "Gestión de Usuarios", icon: Users },
         { title: "Logística", icon: Truck },
         { title: "Contabilidad", icon: Calculator },
         { title: "Producción", icon: Factory },
         { title: "CRM y Ventas", icon: Handshake },
         { title: "Reportes y Analítica", icon: BarChart },
         { title: "Reaprovisionamiento", icon: Package },
         { title: "Recursos Humanos", icon: Users },
         { title: "Mantenimiento", icon: Wrench },
         { title: "Proyectos", icon: Calendar }
     ];

    const subscriptionFeatures = [
        { title: 'Free', monthlyPrice: 0, description: 'Acceso al módulo central y a los módulos de Inventario y Gestión de Usuarios. Ideal para pequeñas empresas.', icon: Gift,
          features: [
            { name: 'Módulo Central y Básico', answer: 'Incluye Inventario y Gestión de Usuarios.' },
            { name: 'Uso para un proyecto', answer: 'Ideal para comenzar.' }
          ]
        },
        { title: 'Pro', monthlyPrice: 29, description: 'Acceso completo a módulos estándar: POS, Ventas, Reportes y Analítica. Escala tu negocio.', icon: Award,
          features: [
            { name: 'Módulos Estándar', answer: 'POS, Ventas, Reportes y Analítica.' },
            { name: 'Soporte por Email', answer: 'Soporte estándar 24/7 via email.' }
          ]
        },
        { title: 'Enterprise', monthlyPrice: 99, description: 'Acceso total a todos los módulos, auditoría avanzada y soporte prioritario.', icon: ShieldCheck,
          features: [
            { name: 'Todos los Módulos', answer: 'Incluye módulos personalizados.' },
            { name: 'Soporte Prioritario', answer: 'Atención preferencial 24/7.' }
          ]
        },
        { title: 'Custom', monthlyPrice: null, description: 'Planes personalizados según tus necesidades, desarrollo de módulos a medida.', icon: Layers,
          features: [
            { name: 'Plan a Medida', answer: 'Diseñado especialmente para tu empresa.' }
          ]
        }
    ];

    const businessExamples = [
        { name: "Tienda de Abarrotes", modules: ["Inventario", "Punto de Venta (POS)", "Contabilidad", "Reaprovisionamiento"] },
        { name: "Restaurante", modules: ["Punto de Venta (POS)", "Inventario", "Logística", "Reportes y Analítica"] },
        { name: "Taller Mecánico", modules: ["Inventario", "Mantenimiento", "CRM y Ventas", "Contabilidad"] },
        { name: "Corporativo", modules: ["Gestión de Usuarios", "Recursos Humanos", "Contabilidad", "Reportes y Analítica"] },
        { name: "eCommerce", modules: ["Inventario", "Punto de Venta (POS)", "Logística", "Reportes y Analítica", "Reaprovisionamiento"] },
        { name: "Clínica Médica", modules: ["Gestión de Usuarios", "Proyectos", "Contabilidad", "Reportes y Analítica"] },
        { name: "Academia / Centro Educativo", modules: ["Gestión de Usuarios", "Proyectos", "Contabilidad", "Reportes y Analítica"] },
        { name: "Agencia de Viajes", modules: ["CRM y Ventas", "Logística", "Contabilidad", "Reportes y Analítica"] }
    ];

  return (
    <main className="bg-[#020617] text-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-[#020617]/80 backdrop-blur-sm z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex space-x-8">
              <button onClick={() => scrollToSection('hero')} className="text-slate-100 font-bold hover:text-white">Inicio</button>
              <button onClick={() => scrollToSection('features')} className="text-slate-300 hover:text-white">Por qué</button>
              <button onClick={() => scrollToSection('faq')} className="text-slate-300 hover:text-white">FAQ</button>
              <button onClick={() => scrollToSection('plans')} className="text-slate-300 hover:text-white">Planes</button>
              <button onClick={() => scrollToSection('ecosystem')} className="text-slate-300 hover:text-white">Módulos</button>
              <button onClick={() => scrollToSection('business')} className="text-slate-300 hover:text-white">Negocios</button>
            </div>
            <div className="flex space-x-4">
              {isAuthenticated ? (
                <AuthMenu />
              ) : (
                <>
                  <Link href="/register">
                    <button className="text-white hover:text-slate-100">Registrar</button>
                  </Link>
                  <Link href="/login">
                    <button className="bg-sky-600 hover:bg-sky-500 text-white font-medium py-1 px-4 rounded">Login</button>
                  </Link>
                </>
              )}
               </div>
          </div>
        </div>
      </nav>
      {/* Page content start below navbar */}
      <div className="pt-16" />
       <div ref={ref} id="hero" className="scroll-mt-16 relative h-screen flex items-center justify-center overflow-hidden">
           <motion.div style={{ y }} className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-gradient-to-b from-sky-900/30 to-slate-900" />
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500 rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500 rounded-full filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
          </motion.div>

          <div className="z-10 text-center px-4">
              <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                  className="text-5xl md:text-7xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400"
              >
                  CoreFoundry
              </motion.h1>
              <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2, ease: "easeInOut" }}
                  className="text-lg md:text-xl max-w-2xl mx-auto mb-6 text-slate-300"
              >
                  Un ERP modular construido con tecnologías modernas, diseñado para ser flexible,
                  escalable y fácil de extender.
              </motion.p>
             {/* Beneficios rápidos */}
             <motion.ul
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8, delay: 0.4, ease: "easeInOut" }}
               className="flex justify-center space-x-6 mb-8 text-slate-300"
             >
               <li className="flex items-center space-x-2">
                 <Shield className="w-5 h-5 text-sky-400" />
                 <span>Seguridad</span>
               </li>
               <li className="flex items-center space-x-2">
                 <Puzzle className="w-5 h-5 text-sky-400" />
                 <span>Modularidad</span>
               </li>
               <li className="flex items-center space-x-2">
                 <Cpu className="w-5 h-5 text-sky-400" />
                 <span>Escalabilidad</span>
               </li>
             </motion.ul>
             {/* CTAs */}
             <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
               <button onClick={() => scrollToSection('plans')} className="bg-sky-600 hover:bg-sky-500 text-white font-medium py-3 px-8 rounded-full shadow-lg transition-all">
                 Empieza Gratis
               </button>
               <button onClick={() => scrollToSection('features')} className="bg-white hover:bg-slate-100 text-sky-600 font-medium py-3 px-8 rounded-full shadow-lg transition-all">
                 Ver Más
               </button>
             </div>
             {/* Indicador de scroll */}
             <button onClick={() => scrollToSection('features')} aria-label="Ir a Por qué CoreFoundry" className="mt-12 animate-bounce text-slate-400">
               <ChevronDown className="w-8 h-8 mx-auto" />
             </button>
          </div>
      </div>

      {/* '¿Por qué CoreFoundry?' section */}
      <div id="features" className="scroll-mt-16 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
               <div className="text-center mb-16">
                   <h2 className="text-4xl font-bold text-slate-100">¿Por qué CoreFoundry?</h2>
                   <p className="mt-4 text-lg text-slate-400">
                       Una plataforma extensible donde cada módulo se conecta a un núcleo central.
                   </p>
               </div>
               <div className="grid md:grid-cols-3 gap-8">
                   {features.map((feature, index) => (
                       <motion.div
                           key={feature.title}
                           initial={{ opacity: 0, y: 50 }}
                           whileInView={{ opacity: 1, y: 0 }}
                           viewport={{ once: true, amount: 0.5 }}
                           transition={{ duration: 0.5, delay: index * 0.2 }}
                           className="p-8 rounded-xl backdrop-blur-sm bg-white/5 border border-white/10 text-center flex flex-col items-center"
                       >
                           <div className="bg-sky-900/50 p-4 rounded-full mb-6">
                              <feature.icon className="w-8 h-8 text-sky-400" />
                          </div>
                          <h3 className="text-2xl font-semibold mb-4 text-slate-100">{feature.title}</h3>
                          <p className="text-slate-300">{feature.description}</p>
                       </motion.div>
                   ))}
               </div>
           </div>
      </div>

      {/* FAQ section */}
      <div id="faq" className="scroll-mt-16 py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
           <div className="max-w-3xl mx-auto">
               <div className="text-center mb-12">
                   <h2 className="text-4xl font-bold text-slate-100">Preguntas Frecuentes</h2>
                   <p className="mt-4 text-lg text-slate-400">
                       Resolvemos tus dudas para que empieces con confianza.
                   </p>
               </div>
               <div className="w-full">
                   {faqs.map((faq, index) => (
                       <AccordionItem
                           key={index}
                           i={index}
                           expanded={expanded}
                           setExpanded={setExpanded}
                           question={faq.question}
                           answer={faq.answer}
                       />
                   ))}
               </div>
           </div>
       </div>

      {/* Plans section */}
      <div id="plans" className="scroll-mt-16 py-20 px-4 sm:px-6 lg:px-8 bg-slate-900">
        <div className="max-w-7xl mx-auto text-center mb-8">
          <h2 className="text-4xl font-bold text-slate-100">Planes de Suscripción</h2>
          <div className="flex justify-center mt-4">
            <button onClick={() => setBillingCycle('monthly')} className={`px-4 py-2 rounded-l-full ${billingCycle === 'monthly' ? 'bg-sky-600 text-white' : 'bg-white/10 text-slate-300'}`}>Mensual</button>
            <button onClick={() => setBillingCycle('annual')} className={`px-4 py-2 rounded-r-full ${billingCycle === 'annual' ? 'bg-sky-600 text-white' : 'bg-white/10 text-slate-300'}`}>Anual</button>
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {subscriptionFeatures.map((plan, index) => {
            const priceLabel = plan.monthlyPrice === null
              ? 'Personalizado'
              : plan.monthlyPrice === 0
                ? 'Gratis'
                : billingCycle === 'monthly'
                  ? `$${plan.monthlyPrice}/mes`
                  : `$${plan.monthlyPrice * 10}/año`;
            return (
              <motion.div key={plan.title} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.5, delay: index * 0.2 }} className="p-8 rounded-xl backdrop-blur-sm bg-white/5 border border-white/10 text-center flex flex-col items-center">
                <div className="bg-sky-900/50 p-4 rounded-full mb-4">
                    <plan.icon className="w-8 h-8 text-sky-400" />
                </div>
                <h3 className="text-2xl font-semibold text-slate-100 mt-4">{plan.title}</h3>
                <p className="mt-2 text-3xl font-bold text-sky-400">{priceLabel}</p>
                {billingCycle === 'annual' && plan.monthlyPrice != null && <p className="text-sm text-slate-300 mt-1">Equivalente a {plan.monthlyPrice * 12} meses al precio de 10</p>}
                <p className="mt-4 text-slate-300 flex-1">{plan.description}</p>
                {/* features details list */}
                <div className="mt-4 w-full text-left">
                  {plan.features.map((feature, i) => (
                    <details key={i} className="mb-2 bg-white/10 rounded p-2">
                      <summary className="flex justify-between items-center cursor-pointer">
                        <div className="flex items-center space-x-2">
                          <Check className="w-5 h-5 text-sky-400" />
                          <span className="text-slate-300">{feature.name}</span>
                        </div>
                        <Info className="w-5 h-5 text-slate-300" />
                      </summary>
                      <div className="mt-2 text-slate-300 text-sm">{feature.answer}</div>
                    </details>
                  ))}
                </div>
                <button
                    className="mt-6 bg-sky-600 hover:bg-sky-500 text-white font-medium py-2 px-6 rounded-full shadow-lg shadow-sky-500/20 transition-all duration-300"
                    onClick={() => {
                        // TODO: Integrar método de pago
                    }}
                >
                    Seleccionar
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Ecosystem section */}
      <div id="ecosystem" className="scroll-mt-16 py-20 px-4 sm:px-6 lg:px-8">
           <div className="max-w-7xl mx-auto">
               <div className="text-center">
                   <h2 className="text-4xl font-bold text-slate-100">Un Ecosistema de Módulos para Cada Necesidad</h2>
                   <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
                       CoreFoundry crece contigo. Conecta módulos pre-construidos o desarrolla los tuyos para crear un ERP a la medida de tu negocio.
                   </p>
               </div>
               <div className="mt-12">
                   <InfiniteScroller items={modules} />
               </div>
           </div>
       </div>

      {/* Business types section */}
      <div id="business" className="scroll-mt-16 py-20 px-4 sm:px-6 lg:px-8 bg-slate-800">
         <div className="max-w-7xl mx-auto">
           <div className="text-center mb-12">
             <h2 className="text-4xl font-bold text-slate-100">Tipos de Negocio</h2>
             <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">Ejemplos de negocios que pueden usar CoreFoundry y sus módulos principales.</p>
           </div>
           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
             {businessExamples.map((biz) => (
               <div key={biz.name} className="p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                 <h3 className="text-2xl font-semibold mb-4 text-slate-100">{biz.name}</h3>
                 <ul className="list-disc list-inside space-y-2 text-slate-300">
                   {biz.modules.map((m) => (<li key={m}>{m}</li>))}
                 </ul>
               </div>
             ))}
           </div>
         </div>
       </div>

       {/* Testimonials section */}
      <div id="testimonials" className="scroll-mt-16 py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
        <div className="max-w-7xl mx-auto text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-100">Testimonios de Clientes</h2>
          <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">Lo que nuestros clientes dicen de CoreFoundry.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { name: 'Empresa A', quote: 'CoreFoundry transformó nuestra gestión y aumentó la eficiencia.' },
            { name: 'Empresa B', quote: 'La modularidad nos permitió un desarrollo ágil y escalable.' },
            { name: 'Empresa C', quote: 'Excelente soporte y una plataforma muy estable.' }
          ].map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.2 }} className="p-8 rounded-xl backdrop-blur-sm bg-white/5 border border-white/10 text-center">
              <p className="text-slate-300 italic mb-4">“{t.quote}”</p>
              <h4 className="text-slate-100 font-semibold">{t.name}</h4>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer with newsletter */}
      <footer className="border-t border-white/10 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center text-slate-400">
          {/* Newsletter Form */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Suscríbete a nuestro newsletter</h3>
            <form className="flex justify-center" onSubmit={e => { e.preventDefault(); /*TODO: integrar suscripción*/ }}>
              <input type="email" placeholder="Tu correo electrónico" className="px-4 py-2 rounded-l bg-slate-700 text-white focus:outline-none" />
              <button type="submit" className="bg-sky-600 hover:bg-sky-500 text-white px-4 rounded-r">Suscribirse</button>
            </form>
          </div>
          <div className="max-w-7xl mx-auto text-center text-slate-400">
               <p>&copy; {new Date().getFullYear()} CoreFoundry. Todos los derechos reservados.</p>
               <div className="flex justify-center space-x-6 mt-4">
                   <Link href="/privacy" className="hover:text-white transition-colors">Política de Privacidad</Link>
                   <Link href="/terms" className="hover:text-white transition-colors">Términos de Servicio</Link>
               </div>
           </div>
           </div>
      </footer>

      {/* Chat Widget */}
      <ChatWidget />
    </main>
  );
}
