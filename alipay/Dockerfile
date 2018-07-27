# Use this docker for development
FROM itprojectsllc/install-odoo:11.0-dev

USER root

RUN pip install wechatpy[cryptography]
# those are included in base image now and can be removed
RUN pip install wdb requests-mock

USER odoo
