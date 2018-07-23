# Use this docker for development
FROM itprojectsllc/install-odoo:11.0-dev

USER root

RUN pip install wechatpy[cryptography] requests-mock[fixture]
RUN pip install wdb

USER odoo
