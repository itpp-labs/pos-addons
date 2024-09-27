{
    "name": """QR Code Scanning in POS""",
    "summary": """Scans QR codes via device's camera""",
    "category": "Point of Sale",
    "images": ["images/main.png"],
    "version": "14.0.1.0.2",
    "application": False,
    "author": "IT-Projects LLC, KolushovAlexandr",
    "support": "help@itpp.dev",
    "website": "https://github.com/itpp-labs/pos-addons#readme",
    "license": "Other OSI approved licence",  # MIT
    "depends": ["pos_qr_payments"],
    "external_dependencies": {"python": [], "bin": []},
    "data": ["views/assets.xml"],
    "qweb": [
        "static/src/xml/Screens/ProductScreen/ControlButtons/QRButton.xml",
        "static/src/xml/Popups/QRScanPopup.xml",
    ],
    "auto_install": False,
    "installable": True,
}
