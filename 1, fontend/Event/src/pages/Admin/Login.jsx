import { Box, Button, Container, Heading, Input, VStack, useToast, FormControl, FormLabel, Text } from "@chakra-ui/react";
import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const toast = useToast();
    const { login, admin } = useAuth();

    // If already logged in, redirect
    if (admin) {
        return <Navigate to="/admin/events" replace />;
    }

    const handleLogin = async () => {
        setIsLoading(true);
        const result = await login(email, password);
        setIsLoading(false);

        if (result.success) {
            toast({ title: "Welcome!", status: "success", duration: 2000 });
            navigate("/admin/events");
        } else {
            toast({ title: "Access Denied", description: result.error, status: "error", duration: 2000 });
        }
    };

    return (
        <Box h="100vh" bgGradient="linear(to-br, brand.900, brand.500)" display="flex" alignItems="center">
            <Container bg="white" p={8} borderRadius="xl" boxShadow="2xl" maxW="sm">
                <VStack spacing={6}>
                    <Heading size="lg" color="brand.800">🎉 Event Admin</Heading>
                    <Text fontSize="sm" color="gray.500">Manage events, coupons, and submissions</Text>

                    <FormControl>
                        <FormLabel>Email</FormLabel>
                        <Input
                            type="email"
                            placeholder="admin@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </FormControl>

                    <FormControl>
                        <FormLabel>Password</FormLabel>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                        />
                    </FormControl>

                    <Button
                        colorScheme="brand"
                        w="100%"
                        onClick={handleLogin}
                        isLoading={isLoading}
                    >
                        Login
                    </Button>


                </VStack>
            </Container>
        </Box>
    );
}
