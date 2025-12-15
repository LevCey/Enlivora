import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
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
  InlineStack
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

// 2. Action: Handle "Enable Passport" click
export const action = async ({ request }) => {
  const formData = await request.formData();
  const productId = formData.get("productId");

  // Call Enlivora Backend to mint passport
  // In real app: await fetch('https://api.enlivora.com/products/' + productId + '/enable-passport', ...)
  
  // Mock success response
  return json({ success: true, productId, status: "active" });
};

export default function ProductsPage() {
  const { products } = useLoaderData();
  const fetcher = useFetcher();

  return (
    <Page title="Enlivora Products">
      <Layout>
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

                // Check if this product was just enabled via fetcher
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
