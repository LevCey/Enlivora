import { Page, Layout, Card, Text, BlockStack, Button, InlineStack } from "@shopify/polaris";
import { useNavigate } from "@remix-run/react";

export default function Index() {
  const navigate = useNavigate();

  return (
    <Page>
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingLg" as="h1">Welcome to Enlivora 🎉</Text>
              <Text variant="bodyMd">
                Create digital passports for your products on Starknet blockchain.
                Each passport proves authenticity and tracks ownership history.
              </Text>
              <InlineStack gap="300">
                <Button variant="primary" onClick={() => navigate("/app/products")}>
                  View Products
                </Button>
                <Button url="https://pass.enlivora.com" target="_blank">
                  Customer Portal
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="200">
              <Text variant="headingMd">Features</Text>
              <Text variant="bodyMd">✓ NFT Product Passports</Text>
              <Text variant="bodyMd">✓ Loyalty Points (ELP)</Text>
              <Text variant="bodyMd">✓ Starknet Blockchain</Text>
              <Text variant="bodyMd">✓ Automatic Webhooks</Text>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="200">
              <Text variant="headingMd">Contracts</Text>
              <Text variant="bodySm" tone="subdued">Passport721 (ENL)</Text>
              <Text variant="bodySm" tone="subdued">LoyaltyPoints (ELP)</Text>
              <Text variant="bodySm" tone="subdued">RewardsVault</Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
