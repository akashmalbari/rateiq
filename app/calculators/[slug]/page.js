import { notFound, redirect } from 'next/navigation';
import CalculatorPageClient from '../../../components/new-calculators/CalculatorPageClient';
import { calculatorConfigs, getCalculatorConfig } from '../../../data/calculators';

export function generateStaticParams() {
  return calculatorConfigs.map((calculator) => ({ slug: calculator.slug }));
}

export function generateMetadata({ params }) {
  const calculator = getCalculatorConfig(params.slug);

  if (!calculator) {
    return {
      title: 'Calculator Not Found',
      description: 'The requested calculator could not be found.',
    };
  }

  return {
    title: calculator.metaTitle,
    description: calculator.metaDescription,
    alternates: {
      canonical: `/calculators/${calculator.slug}`,
    },
  };
}

export default function CalculatorPage({ params }) {
  if (params.slug === 'car-lease-vs-buy') {
    redirect('/decisions/lifestyle/car-lease-vs-buy');
  }

  const calculator = getCalculatorConfig(params.slug);

  if (!calculator) {
    notFound();
  }

  return <CalculatorPageClient slug={params.slug} />;
}
