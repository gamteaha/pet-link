import ShopItemClient from "./ShopItemClient";

export function generateStaticParams() {
  return [
    { id: 'dedenne' },
    { id: 'cat' },
    { id: 'human' }
  ];
}

export default async function ShopItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ShopItemClient id={id} />;
}
