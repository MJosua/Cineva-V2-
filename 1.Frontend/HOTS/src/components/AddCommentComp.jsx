import React from "react";

const AddReplyComp = () => {




    return (
<div className="container">
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header bg-warning">
                        <h5 className="modal-title "
                            id="modalBasicLabel">Tambahkan Komentar</h5>
                        <button type="button"
                            className="btn-close" aria-label="Close"></button>
                    </div>
                    <div className="form-floating p-2">
                        <textarea className="form-control"
                            placeholder="Leave a comment here"
                            id="floatingTextarea" >
                        </textarea>
                    </div>
                    <div className="modal-footer">
                        <button type="button"
                            className="btn px-2 btn-warning">
                            < MdAddPhotoAlternate size={23} />
                        </button>
                        <button type="button"
                            className="btn btn-warning">
                            Buat Post!
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )


}

export default AddReplyComp;
