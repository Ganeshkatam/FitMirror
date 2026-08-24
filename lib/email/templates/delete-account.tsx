import * as React from 'react'
import {
    Body,
    Button,
    Container,
    Head,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
} from '@react-email/components'
import { emailStyles } from '../styles'

interface DeleteAccountEmailProps {
    confirmUrl: string
}

export const DeleteAccountEmail = ({
    confirmUrl,
}: DeleteAccountEmailProps) => (
    <Html>
        <Head />
        <Preview>Confirm your FitMirror account deletion</Preview>
        <Body style={emailStyles.main}>
            <Container style={emailStyles.container}>
                <Section style={emailStyles.box}>
                    <Text style={emailStyles.paragraph}>
                        Hi there,
                    </Text>
                    <Text style={emailStyles.paragraph}>
                        We received a request to permanently delete your FitMirror account.
                        If you did not make this request, you can safely ignore this email.
                    </Text>
                    <Text style={emailStyles.paragraph}>
                        This action is irreversible. All your data, including orders and profile information, will be permanently removed.
                    </Text>
                    <Button
                        style={{ ...emailStyles.button, backgroundColor: '#dc2626' }}
                        href={confirmUrl}
                    >
                        Confirm Account Deletion
                    </Button>
                    <Hr style={emailStyles.hr} />
                    <Text style={emailStyles.paragraph}>
                        If the button doesn&apos;t work, copy and paste this link into your browser:
                    </Text>
                    <Link href={confirmUrl} style={emailStyles.anchor}>
                        {confirmUrl}
                    </Link>
                    <Text style={emailStyles.footer}>
                        FitMirror Inc.
                    </Text>
                </Section>
            </Container>
        </Body>
    </Html>
)

export default DeleteAccountEmail
