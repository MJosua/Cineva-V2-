import { Modal, Button, ModalBody, ModalContent, ModalOverlay, Input, useDisclosure, useToast, ModalCloseButton, Image } from "@chakra-ui/react";

const SessionModal = ({
    isOpenModalToken,
    handleLogout,
    uid,
    onLogin,
    pswd,
    setPswd
}) => {
    

    return (
        <Modal
            isOpen={isOpenModalToken}
            onClose={handleLogout}
            motionPreset="slideInBottom"
            size="xl"
        >
            <ModalOverlay>
                <ModalContent>
                    <ModalCloseButton onClick={handleLogout} />
                    <ModalBody className="py-4">
                        <div className="container-fluid px-5 pb-3">
                            <div className="row">
                                <div className="col-12 d-flex justify-content-center py-3">
                                    <Image src={"../image/notif.png"} />
                                </div>
                                <div className="col-12 text-center fw-bold fs-5">
                                    Dear {uid}, <br />
                                    Your session has expired due to inactivity.<br />
                                    Please re-enter your password to continue.
                                </div>
                                <div className="col-12 px-5 mt-3">
                                    <form className="w-100" onSubmit={onLogin}>
                                        <Input
                                            placeholder="Password"
                                            type="password"
                                            className="text-center w-100"
                                            value={pswd}
                                            onChange={(e) => setPswd(e.target.value)}
                                        />
                                        <Button
                                            type="submit"
                                            className="w-100 mt-3 btn-danger"
                                            colorScheme="red"
                                        >
                                            Sign in
                                        </Button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </ModalBody>
                </ModalContent>
            </ModalOverlay>
        </Modal>
    );
};

export default SessionModal;
