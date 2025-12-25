import { json } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import { Page, Layout, Card, Button, BlockStack, Text, Banner } from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  
  // Lüks Ürün Listesi
  const products = [
    {
      title: "The Sovereign Chronograph",
      description: "A masterpiece of horology. Limited edition Enlivora exclusive. 18k Rose Gold case with perpetual calendar complication.",
      price: "45000.00",
      image: "The_Sovereign_Chronograph.png"
    },
    {
      title: "Enlivora Genesis Key",
      description: "The digital-physical artifact granting access to the inner circle. Hand-forged obsidian finish.",
      price: "10000.00",
      image: "Enlivora_Genesis_Key.png"
    },
    {
      title: "Royal Silk Scarf - Midnight Edition",
      description: "100% Mulberry silk with hand-rolled edges. Embedded NFC authentication chip.",
      price: "2500.00",
      image: "Royal_Silk_Scarf.png"
    }
  ];

  const results = [];

  for (const product of products) {
    const response = await admin.graphql(
      `#graphql
      mutation createProduct($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id
            title
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          input: {
            title: product.title,
            descriptionHtml: product.description,
            status: "ACTIVE",
            variants: [
              {
                price: product.price,
                inventoryQuantities: [
                    {
                        availableQuantity: 10,
                        locationId: "gid://shopify/Location/96232243493" // Not: Otomatik lokasyon bulma eklenebilir, şimdilik varsayılanı dener.
                    }
                ]
              }
            ],
            images: [
                {
                    src: product.image
                }
            ]
          }
        }
      }
    );
    
    const data = await response.json();
    
    // Lokasyon hatası alırsak (locationId hardcoded olduğu için), lokasyonsuz deneyelim (stoksuz)
    if (data.data.productCreate.userErrors.length > 0) {
        console.log("Retrying without inventory for:", product.title);
         await admin.graphql(
            `#graphql
            mutation createProduct($input: ProductInput!) {
                productCreate(input: $input) {
                product { id title }
                }
            }`,
            {
                variables: {
                input: {
                    title: product.title,
                    descriptionHtml: product.description,
                    status: "ACTIVE",
                    variants: [{ price: product.price }],
                    images: [{ src: product.image }]
                }
                }
            }
        );
    }
    results.push(product.title);
  }

  return json({ success: true, created: results });
};

export default function SeedPage() {
  const fetcher = useFetcher();
  const isLoading = fetcher.state === "submitting";
  const isSuccess = fetcher.data?.success;

  return (
    <Page title="Enlivora Demo Setup">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Populate Store with Luxury Items
              </Text>
              <p>
                This action will create 3 high-end demo products in your store to demonstrate the Enlivora luxury workflow.
              </p>
              
              {isSuccess && (
                <Banner tone="success">
                  Successfully created: {fetcher.data.created.join(", ")}
                </Banner>
              )}

              <fetcher.Form method="post">
                <Button submit variant="primary" loading={isLoading}>
                  Generate Luxury Products
                </Button>
              </fetcher.Form>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
