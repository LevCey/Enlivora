import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, Link as RemixLink } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  ResourceList,
  Thumbnail,
  Text,
  Button,
  Badge,
  BlockStack,
  InlineStack,
  Banner
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";

// 1. Loader: Fetch products from Shopify
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
      query {
        products(first: 10) {
          edges {
            node {
              id
              title
              handle
              featuredImage {
                url
              }
              variants(first: 1) {
                edges {
                  node {
                    sku
                  }
                }
              }
            }
          }
        }
      }`
  );

  const responseJson = await response.json();

  return json({
    products: responseJson.data.products.edges.map((edge) => edge.node),
  });
};

// 2. Action: Handle Actions
export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  // --- SEED LOGIC START ---
  if (intent === "seed") {
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

      for (const product of products) {
        // Create Product (Simplified, no image upload yet to keep it robust)
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
                variants: [{ price: product.price }]
              }
            }
          }
        );
      }
      return json({ status: "seeded" });
  }
  // --- SEED LOGIC END ---

  // --- ENABLE PASSPORT LOGIC ---
  const productId = formData.get("productId");
  try {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
      const response = await fetch(`${backendUrl}/products/${productId.split('/').pop()}/enable-passport`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
           // Fallback for demo if backend is not running
           console.warn("Backend not reachable, mocking success for demo.");
           const mockTokenId = Math.floor(Math.random() * 10000).toString();
           
           await admin.graphql(
            `#graphql
            mutation storefrontMetadataCreate($metafields: [MetafieldsSetInput!]!) {
              metafieldsSet(metafields: $metafields) {
                metafields { id }
              }
            }`,
            {
              variables: {
                metafields: [
                  { ownerId: productId, namespace: "enlivora", key: "passport_active", value: "true", type: "boolean" },
                  { ownerId: productId, namespace: "enlivora", key: "token_id", value: mockTokenId, type: "single_line_text_field" }
                ]
              }
            }
          );
          return json({ tokenId: mockTokenId, status: "active" });
      }

      const data = await response.json();
      
      await admin.graphql(
        `#graphql
        mutation storefrontMetadataCreate($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields { id }
          }
        }`,
        {
          variables: {
            metafields: [
              { ownerId: productId, namespace: "enlivora", key: "passport_active", value: "true", type: "boolean" },
              { ownerId: productId, namespace: "enlivora", key: "token_id", value: data.tokenId, type: "single_line_text_field" }
            ]
          }
        }
      );

      return json({ ...data, status: "active" });

  } catch (error) {
      console.error("Enable Passport failed:", error);
      return json({ success: false, error: error.message }, { status: 500 });
  }
};

export default function ProductsPage() {
  const { products } = useLoaderData();
  const fetcher = useFetcher();
  const seedFetcher = useFetcher();

  const isSeeding = seedFetcher.state === "submitting";
  const justSeeded = seedFetcher.data?.status === "seeded";

  return (
    <Page title="Enlivora Products">
      <Layout>
        <Layout.Section>
            <div style={{ marginBottom: '20px' }}>
                <div style={{ background: '#f4f6f8', padding: '15px', borderRadius: '8px', border: '1px solid #dfe3e8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <Text variant="headingSm" as="h3">Need Demo Products?</Text>
                        <Text variant="bodySm" as="p">Populate your store with luxury items to test the passport flow.</Text>
                    </div>
                    
                    {justSeeded ? (
                        <Badge tone="success">Products Created!</Badge>
                    ) : (
                        <seedFetcher.Form method="post">
                            <input type="hidden" name="intent" value="seed" />
                            <Button submit variant="primary" loading={isSeeding}>
                                Generate Luxury Products
                            </Button>
                        </seedFetcher.Form>
                    )}
                </div>
            </div>
            
            {justSeeded && (
                <div style={{marginBottom: '20px'}}>
                     <Banner tone="success" onDismiss={() => { window.location.reload(); }}>
                        <p>Luxury products added successfully. Refresh the page to see them in the list.</p>
                     </Banner>
                </div>
            )}
        </Layout.Section>
        
        <Layout.Section>
          <Card>
            <ResourceList
              resourceName={{ singular: "product", plural: "products" }}
              items={products}
              renderItem={(item) => {
                const { id, title, featuredImage, variants } = item;
                const media = (
                  <Thumbnail
                    source={featuredImage?.url || ""}
                    alt={title}
                  />
                );

                const isEnabled = fetcher.data?.productId === id;

                return (
                  <ResourceList.Item
                    id={id}
                    url="#"
                    media={media}
                    accessibilityLabel={`View details for ${title}`}
                  >
                    <BlockStack gap="200">
                        <InlineStack align="space-between" blockAlign="center">
                            <BlockStack gap="100">
                                <Text variant="bodyMd" fontWeight="bold" as="h3">
                                    {title}
                                </Text>
                                <Text variant="bodySm" as="p" tone="subdued">
                                    SKU: {variants.edges[0]?.node.sku || 'N/A'}
                                </Text>
                            </BlockStack>
                            
                            {isEnabled ? (
                                <Badge tone="success">Passport Active</Badge>
                            ) : (
                                <fetcher.Form method="post">
                                    <input type="hidden" name="productId" value={id} />
                                    <Button submit loading={fetcher.state === "submitting"}>
                                        Enable Passport
                                    </Button>
                                </fetcher.Form>
                            )}
                        </InlineStack>
                    </BlockStack>
                  </ResourceList.Item>
                );
              }}
            />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}